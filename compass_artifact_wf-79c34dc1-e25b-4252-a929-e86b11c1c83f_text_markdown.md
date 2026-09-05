# Technical architecture for a SellerAmp SAS competitor

**This specification defines the complete technical blueprint for an AI-native, multi-marketplace sourcing analysis platform targeting Amazon FBA/FBM sellers doing Online Arbitrage, Retail Arbitrage, and Wholesale.** The architecture spans a Chrome extension, React Native mobile app, web dashboard, and backend API — all unified by a shared TypeScript codebase and an ML-powered deal scoring engine. What follows is an implementation-ready document covering every layer of the stack, from database schemas to service worker lifecycle management.

The platform must analyze products across Amazon and eBay in **under 2 seconds**, serve cached results in **under 1 second**, and scale from hundreds to tens of thousands of concurrent sellers. Every technology choice below is justified against alternatives, with specific versions, cost projections, and configuration patterns.

---

## 1. Recommended tech stack with justification

The unifying principle is **TypeScript everywhere** — shared types between Chrome extension, mobile app, web dashboard, and backend eliminate an entire class of integration bugs and accelerate development velocity.

**Frontend layer:**

| Component | Technology | Version | Justification |
|---|---|---|---|
| Chrome Extension | React + Vite + MV3 | React 19, Vite 6 | Shadow DOM isolation on Amazon pages; Vite builds under 2s; MV3 required by Chrome Web Store |
| Web Dashboard | Next.js (App Router) | 15+ | SSR for SEO, React Server Components for data-heavy dashboards, Vercel deployment simplicity |
| Mobile App | React Native + Expo | SDK 55, RN 0.83 | New Architecture mandatory; Expo CNG eliminates native code management; EAS Build for CI/CD |

**Backend layer:**

| Component | Technology | Version | Justification |
|---|---|---|---|
| Core API | NestJS (Node.js) | NestJS 11, Node 22 LTS | TypeScript-native, module architecture maps to domain boundaries, first-class guard/interceptor patterns, strong ORM ecosystem |
| ML Service | Python FastAPI | FastAPI 0.110+ | ONNX Runtime + LightGBM ecosystem is Python-native; async by default; auto-generated OpenAPI docs |
| ORM | Prisma | 6+ | Type-safe client generated from schema, excellent migration tooling, fastest DX for rapid iteration |

**Data layer:**

| Component | Technology | Justification |
|---|---|---|
| Primary DB | PostgreSQL 16 (Aurora Serverless v2) | Auto-scales 0.5–128 ACUs, Multi-AZ, JSONB for flexible product attributes |
| Time-series | TimescaleDB extension | Hypertables for price/BSR history with native compression (90%+ ratio), continuous aggregates |
| Cache | ElastiCache Redis 7 (Serverless) | Sub-millisecond reads, pub/sub for WebSocket scaling, BullMQ job queue backend |
| Search | PostgreSQL GIN indexes + `pg_trgm` | Full-text product search without a separate search cluster; migrate to OpenSearch only if needed at 10M+ products |

**Infrastructure:**

| Component | Technology | Justification |
|---|---|---|
| Compute | AWS ECS Fargate (Graviton/ARM) | No server management, per-second billing, 20% cost savings on ARM |
| CDN | CloudFront | Global edge caching for API responses and static assets |
| CI/CD | GitHub Actions → ECR → ECS | Native AWS credential federation, parallel test/build/deploy jobs |
| IaC | AWS CDK (TypeScript) | Same language as backend, L2 constructs for Fargate/Aurora/ElastiCache |
| Monitoring | CloudWatch + X-Ray | Distributed tracing across NestJS ↔ FastAPI services |

**ML/AI:**

| Component | Technology | Justification |
|---|---|---|
| Training | LightGBM 4.x | 20× faster training than XGBoost via GOSS+EFB, native categorical support |
| Production inference | ONNX Runtime 1.17+ | **2–5ms per prediction** for tree models, language-agnostic serving |
| Experiment tracking | MLflow 2.10+ | Model registry, versioning, A/B deployment aliases |
| Feature store | Feast 0.35+ (Redis online) | Eliminates training-serving skew |
| LLM summaries | GPT-4o-mini | $0.15/$0.60 per MTok — natural language deal explanations at ~$0.0003/deal |
| LLM risk assessment | Claude Haiku 3.5 | Brand/IP risk scoring at ~$0.002/assessment |

---

## 2. Comprehensive database schema

### Core entity design

The schema is organized around a **product-centric model** where ASINs serve as the primary foreign key for price history, BSR history, offers, fees, and risk data. Multi-marketplace support uses a `marketplace_id` discriminator across all product-related tables.

```sql
-- =============================================
-- PRODUCTS: Core product catalog
-- =============================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asin            VARCHAR(10) NOT NULL,
    marketplace_id  VARCHAR(5) NOT NULL DEFAULT 'ATVPDKIKX0DER', -- Amazon US
    title           TEXT,
    brand           VARCHAR(255),
    manufacturer    VARCHAR(255),
    category_id     BIGINT,
    category_name   VARCHAR(500),
    product_type    VARCHAR(100),
    parent_asin     VARCHAR(10),
    variation_count SMALLINT DEFAULT 0,
    weight_grams    INTEGER,
    length_cm       NUMERIC(8,2),
    width_cm        NUMERIC(8,2),
    height_cm       NUMERIC(8,2),
    size_tier       VARCHAR(50),       -- 'Small Standard', 'Large Standard', 'Small Oversize', etc.
    image_url       TEXT,
    upc             VARCHAR(14),
    ean             VARCHAR(14),
    isbn            VARCHAR(13),
    is_hazmat       BOOLEAN DEFAULT FALSE,
    is_meltable     BOOLEAN DEFAULT FALSE,
    is_adult        BOOLEAN DEFAULT FALSE,
    product_data    JSONB,             -- Flexible attributes from SP-API
    last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(asin, marketplace_id)
);

CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_upc ON products(upc) WHERE upc IS NOT NULL;
CREATE INDEX idx_products_ean ON products(ean) WHERE ean IS NOT NULL;
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_title_gin ON products USING GIN (to_tsvector('english', title));

-- =============================================
-- PRICE HISTORY: TimescaleDB hypertable
-- =============================================
CREATE TABLE price_history (
    product_id          UUID NOT NULL REFERENCES products(id),
    recorded_at         TIMESTAMPTZ NOT NULL,
    buy_box_price       INTEGER,       -- cents (NULL = no Buy Box)
    amazon_price        INTEGER,       -- cents (NULL = Amazon not selling)
    lowest_fba_price    INTEGER,       -- cents
    lowest_fbm_price    INTEGER,       -- cents
    new_offer_count     SMALLINT,
    used_offer_count    SMALLINT,
    fba_seller_count    SMALLINT,
    fbm_seller_count    SMALLINT,
    source              VARCHAR(20) DEFAULT 'keepa', -- 'keepa', 'sp_api', 'scraped'
    PRIMARY KEY (product_id, recorded_at)
);

SELECT create_hypertable('price_history', 'recorded_at',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

ALTER TABLE price_history SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'product_id',
    timescaledb.compress_orderby = 'recorded_at DESC'
);

SELECT add_compression_policy('price_history', INTERVAL '14 days');
SELECT add_retention_policy('price_history', INTERVAL '2 years');

-- Continuous aggregate for daily summaries (used for charts/trends)
CREATE MATERIALIZED VIEW price_history_daily
WITH (timescaledb.continuous) AS
SELECT
    product_id,
    time_bucket('1 day', recorded_at) AS day,
    AVG(buy_box_price) AS avg_buy_box,
    MIN(buy_box_price) AS min_buy_box,
    MAX(buy_box_price) AS max_buy_box,
    AVG(fba_seller_count)::SMALLINT AS avg_fba_sellers,
    MAX(new_offer_count) AS max_offers
FROM price_history
GROUP BY product_id, time_bucket('1 day', recorded_at);

-- =============================================
-- BSR HISTORY: Separate hypertable
-- =============================================
CREATE TABLE bsr_history (
    product_id      UUID NOT NULL REFERENCES products(id),
    recorded_at     TIMESTAMPTZ NOT NULL,
    bsr             INTEGER NOT NULL,
    category_id     BIGINT NOT NULL,
    PRIMARY KEY (product_id, recorded_at, category_id)
);

SELECT create_hypertable('bsr_history', 'recorded_at',
    chunk_time_interval => INTERVAL '7 days'
);

-- =============================================
-- SALES ESTIMATES
-- =============================================
CREATE TABLE sales_estimates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id),
    estimated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monthly_units   INTEGER NOT NULL,
    estimation_method VARCHAR(30) NOT NULL, -- 'bsr_curve', 'bsr_drops', 'keepa'
    confidence      NUMERIC(3,2),          -- 0.00 to 1.00
    bsr_at_estimate INTEGER,
    UNIQUE(product_id, estimated_at, estimation_method)
);

-- =============================================
-- FEE CALCULATIONS
-- =============================================
CREATE TABLE fee_calculations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID NOT NULL REFERENCES products(id),
    marketplace_id      VARCHAR(5) NOT NULL,
    fulfillment_type    VARCHAR(3) NOT NULL, -- 'FBA' or 'FBM'
    sell_price          INTEGER NOT NULL,    -- cents
    referral_fee        INTEGER NOT NULL,
    fba_fulfillment_fee INTEGER,
    variable_closing_fee INTEGER DEFAULT 0,
    storage_fee_monthly INTEGER,
    total_fees          INTEGER NOT NULL,
    fee_data            JSONB,               -- Full fee breakdown from SP-API
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fees_product ON fee_calculations(product_id, marketplace_id, fulfillment_type);

-- =============================================
-- EBAY PRODUCTS (cross-marketplace matching)
-- =============================================
CREATE TABLE ebay_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES products(id), -- Link to Amazon product if matched
    ebay_item_id    VARCHAR(20) NOT NULL UNIQUE,
    title           TEXT,
    category_id     INTEGER,
    condition       VARCHAR(50),
    current_price   INTEGER,          -- cents
    sold_price      INTEGER,          -- cents (if sold)
    sold_date       TIMESTAMPTZ,
    shipping_cost   INTEGER,
    seller_username VARCHAR(100),
    seller_feedback_pct NUMERIC(5,2),
    listing_type    VARCHAR(20),      -- 'FixedPrice', 'Auction'
    image_url       TEXT,
    item_data       JSONB,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ebay_product_link ON ebay_products(product_id) WHERE product_id IS NOT NULL;

-- =============================================
-- IP / BRAND RISK
-- =============================================
CREATE TABLE brand_risk (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name      VARCHAR(255) NOT NULL,
    risk_level      VARCHAR(20) NOT NULL DEFAULT 'unknown', -- 'low', 'medium', 'high', 'critical'
    risk_score      SMALLINT CHECK (risk_score BETWEEN 0 AND 100),
    ip_complaint_count INTEGER DEFAULT 0,
    known_issues    TEXT[],
    assessment_data JSONB,
    last_assessed   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_name)
);

CREATE TABLE product_restrictions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id),
    seller_id       UUID NOT NULL REFERENCES users(id),
    restriction_type VARCHAR(50) NOT NULL,  -- 'BRAND_GATED', 'CATEGORY_GATED', 'CONDITION_RESTRICTED'
    condition_type   VARCHAR(20),           -- 'new_new', 'used_like_new', etc.
    is_restricted   BOOLEAN NOT NULL,
    approval_url    TEXT,
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, seller_id, condition_type)
);

-- =============================================
-- USERS, TEAMS, ROLES
-- =============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(255),
    avatar_url      TEXT,
    team_id         UUID REFERENCES teams(id),
    role            VARCHAR(20) NOT NULL DEFAULT 'owner',  -- 'owner','admin','manager','va'
    stripe_customer_id VARCHAR(50),
    mfa_secret      VARCHAR(255),       -- Encrypted TOTP secret
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    sp_api_refresh_token TEXT,          -- Encrypted
    sp_api_seller_id     VARCHAR(20),
    sp_api_marketplace   VARCHAR(5),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    owner_id        UUID NOT NULL REFERENCES users(id),
    max_members     SMALLINT DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id),
    email           VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'va',
    token           VARCHAR(64) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ
);

-- =============================================
-- DEAL PIPELINES (Kanban)
-- =============================================
CREATE TABLE deal_pipelines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id),
    name            VARCHAR(255) NOT NULL DEFAULT 'Default Pipeline',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_stages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id     UUID NOT NULL REFERENCES deal_pipelines(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL, -- 'New', 'Analyzing', 'Approved', 'Purchased', 'Listed'
    sort_order      SMALLINT NOT NULL,
    color           VARCHAR(7)             -- '#22c55e'
);

CREATE TABLE deals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id     UUID NOT NULL REFERENCES deal_pipelines(id),
    stage_id        UUID NOT NULL REFERENCES pipeline_stages(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    assigned_to     UUID REFERENCES users(id),
    buy_price       INTEGER,               -- cents
    sell_price      INTEGER,
    estimated_profit INTEGER,
    estimated_roi   NUMERIC(6,2),
    deal_score      SMALLINT,              -- 0-100
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);

-- =============================================
-- BUY LISTS / PURCHASE ORDERS
-- =============================================
CREATE TABLE buy_lists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id),
    name            VARCHAR(255) NOT NULL,
    supplier_id     UUID REFERENCES suppliers(id),
    status          VARCHAR(20) DEFAULT 'draft', -- 'draft','submitted','partial','received'
    total_cost      INTEGER DEFAULT 0,
    total_expected_profit INTEGER DEFAULT 0,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buy_list_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buy_list_id     UUID NOT NULL REFERENCES buy_lists(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_cost       INTEGER NOT NULL,      -- cents
    expected_sell_price INTEGER,
    expected_profit INTEGER,
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0
);

-- =============================================
-- SCAN HISTORY
-- =============================================
CREATE TABLE scan_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    product_id      UUID REFERENCES products(id),
    barcode         VARCHAR(20),
    barcode_format  VARCHAR(10),           -- 'UPC', 'EAN', 'ISBN', 'ASIN'
    scan_source     VARCHAR(20) NOT NULL,  -- 'chrome_ext', 'mobile_camera', 'mobile_bt', 'manual'
    buy_price       INTEGER,
    result_data     JSONB,                 -- Snapshot of analysis at scan time
    decision        VARCHAR(20),           -- 'buy', 'skip', 'watchlist'
    location_name   VARCHAR(255),
    scanned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_user_date ON scan_history(user_id, scanned_at DESC);
CREATE INDEX idx_scans_product ON scan_history(product_id);

-- =============================================
-- SUPPLIERS (Wholesale)
-- =============================================
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id),
    name            VARCHAR(255) NOT NULL,
    contact_name    VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    website         TEXT,
    min_order_qty   INTEGER,
    min_order_value INTEGER,               -- cents
    payment_terms   VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS / BILLING
-- =============================================
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) UNIQUE,
    stripe_subscription_id VARCHAR(50) UNIQUE,
    plan_id             VARCHAR(30) NOT NULL, -- 'free','starter','professional','team'
    status              VARCHAR(20) NOT NULL,  -- 'active','past_due','canceled','trialing'
    current_period_start TIMESTAMPTZ,
    current_period_end   TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    daily_lookup_count   INTEGER DEFAULT 0,
    daily_lookup_limit   INTEGER DEFAULT 20,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexing and partitioning strategy

**Time-series partitioning** is the most critical architectural decision. The `price_history` table will grow to billions of rows. TimescaleDB hypertables with **7-day chunk intervals** provide automatic partitioning, with compression kicking in after 14 days (achieving **90–95% compression ratios**). A retention policy auto-drops raw data older than 2 years while continuous aggregates preserve daily summaries indefinitely.

**Composite indexes** target the most frequent query patterns: product lookup by ASIN+marketplace (the Chrome extension's primary query), price history by product+date range (chart rendering), and scan history by user+date (mobile history view). **Partial indexes** with `WHERE` clauses reduce index bloat — the UPC/EAN indexes only cover non-null rows since many products lack these identifiers.

### Storage estimates

| Scale | Products | Price History (1yr) | Total DB Size | Monthly RDS Cost |
|---|---|---|---|---|
| **Startup** (1M products) | ~2 GB | ~50 GB (compressed) | ~60 GB | ~$150/mo |
| **Growth** (10M products) | ~20 GB | ~500 GB (compressed) | ~550 GB | ~$600/mo |
| **Scale** (50M products) | ~100 GB | ~2.5 TB (compressed) | ~2.8 TB | ~$2,000/mo |

Price history assumes **4 snapshots per day per product**. With TimescaleDB compression at 90%+ ratios, the raw 500 GB for 10M products compresses to roughly 50 GB. Without compression, the 10M-product tier would require ~5 TB.

---

## 3. API architecture across all integrations

### Amazon SP-API integration

The SP-API is the platform's primary data source. The critical optimization: **POST-based batch endpoints are unmetered** under the 2026 billing structure, while GET requests count against usage tiers.

**Endpoints required (with rate limits):**

| API | Operation | Rate | Burst | Metered? |
|---|---|---|---|---|
| Catalog Items v2022-04-01 | `GET /catalog/2022-04-01/items` | 2/s | 2 | Yes |
| Catalog Items v2022-04-01 | `GET /catalog/2022-04-01/items/{asin}` | 2/s | 2 | Yes |
| Product Pricing v2022-05-01 | `POST .../competitiveSummary` | 0.033/s | 1 | **No** (POST) |
| Product Fees v0 | `POST .../feesEstimate` (batch) | 0.5/s | 1 | **No** (POST) |
| Restrictions v2021-08-01 | `GET .../restrictions` | 5/s | 10 | Yes |

**Optimal single-product analysis flow** consumes only **2 metered GET calls** plus 2 unmetered POST calls. By batching 20 ASINs per `getCompetitiveSummary` call, analyzing 20 products requires approximately 22 GET calls total.

**2026 fee structure** (effective January 31, 2026): **$1,400/year** annual subscription plus usage-based monthly tiers starting April 30, 2026. The Basic tier includes **2.5M free GET calls/month** at $0/month, sufficient for analyzing ~1.25M products monthly. Overage costs $0.40 per 1,000 calls. For a tool making 5M GET calls/month, annual cost is approximately **$2,400**.

**Authentication flow** uses Login with Amazon (LWA) OAuth: seller authorizes → exchange `spapi_oauth_code` for tokens within 5 minutes → store encrypted `refresh_token` (long-lived, 365-day re-authorization cycle) → cache `access_token` (1-hour TTL, refresh 5 minutes before expiry). Rate limits are **per selling partner + application pair**, meaning N connected sellers provide N× throughput.

**Caching TTLs by data type:**

| Data Type | TTL | Rationale |
|---|---|---|
| Product details (title, brand, dimensions) | 24–72 hours | Rarely changes |
| Product identifiers (UPC, EAN) | 7–30 days | Static |
| BSR / Sales Rank | 1–4 hours | Moderate volatility |
| Buy Box price / competitive pricing | 15–60 minutes | High volatility; critical for decisions |
| Fee estimates | 4–24 hours | Changes only on annual fee schedule updates |
| Listing restrictions | 6–24 hours | Changes when seller gets ungated |

**Notification-driven invalidation** via `ANY_OFFER_CHANGED` and `PRICING_HEALTH` subscriptions eliminates polling entirely for price changes. The shared product cache serves all users looking at the same ASIN — only seller-specific data (restrictions, fees for their account) requires per-user calls.

### Keepa API integration

Keepa provides the historical backbone that SP-API lacks: **multi-year price/BSR history**, sales rank drop counting, and the `monthlySold` estimation field.

**Token economics:** Keepa uses a token-per-minute regeneration model. The recommended starting plan at **€249/month** (100 tokens/minute) provides approximately **144,000 queries/day**. Each basic product query costs **1 token per ASIN** with batches up to **100 ASINs per request**. Adding `buybox=True` increases cost to 5 tokens per product, while the `stats` parameter is **free** and should always be included.

**Keepa data decoding** requires understanding two key transformations. Time values use Keepa minutes: `unix_ms = (keepa_minutes + 21564000) × 60000`. Prices are stored in **cents as integers**, with `-1` indicating out-of-stock. The `csv` field is a 2D array where each data type has a fixed index: index 0 = Amazon price, index 3 = BSR, index 10 = lowest FBA price, index 18 = Buy Box price including shipping.

**Cost optimization strategy:** Cache all Keepa responses by ASIN with 1–6 hour TTL for price data, 24–72 hours for metadata. Use the `days` parameter to limit history retrieval to 90 days (reduces response size dramatically). Always batch to 100 ASINs. Avoid `buybox=True` unless the user specifically requests Buy Box analysis. At 1,000 active users making 100 lookups/day, the €249/month plan provides sufficient capacity with aggressive caching.

### eBay API integration

eBay presents the biggest data access challenge. The **Finding API was fully decommissioned February 5, 2025** — `findCompletedItems` is gone.

**Browse API** (`/buy/browse/v1/`) provides active listing search and item details at **5,000 calls/day** default (expandable via Application Growth Check to 3M+/day). It uses client credentials grant (application token, 2-hour TTL) and returns price, condition, shipping, seller info, and category data. However, it **cannot access sold/completed listing data**.

**Marketplace Insights API** provides sold item data for the last 90 days — the critical data for eBay comp analysis — but is **restricted and effectively closed to new developers**. Applications require direct eBay Developer Support contact with business justification. Multiple community reports confirm routine denials for small developers. **Mitigation plan:** Apply immediately while building alternative approaches — Terapeak integration via eBay Seller Hub (available to Store subscribers), tracking active listings and inferring sold status when they disappear, or third-party data providers.

**eBay fee calculation** must be built in-code since no API endpoint exists. The formula: `total_fees = (sale_amount × category_FVF_rate) + per_order_fee`. Most categories charge **13.25%** (Store subscribers) or **13.6%** (non-Store), plus a **$0.30** per-order fee for items ≤$10 or **$0.40** for items >$10. Maintain a category-specific fee lookup table updated quarterly.

### Internal REST API design

**REST as the primary protocol** serves Chrome extension, mobile, and web clients uniformly. REST wins over GraphQL here because the extension needs minimal payloads, HTTP caching works natively for product data, and per-endpoint rate limiting is straightforward. GraphQL can be added later for complex dashboard analytics.

**Core product analysis endpoint:**

```
POST /api/v1/products/analyze       → Single ASIN (sync, <2s)
POST /api/v1/products/analyze/bulk  → Batch (async, returns jobId)
GET  /api/v1/products/:asin         → Cached product data
GET  /api/v1/products/:asin/history → Price history with date range
```

**Rate limiting per plan** uses sliding window with Redis via `@nestjs/throttler`:

| Plan | Requests/min | Lookups/day | Bulk analyses/day |
|---|---|---|---|
| Free | 30 | 20 | 0 |
| Starter ($29/mo) | 60 | 200 | 5 |
| Professional ($79/mo) | 120 | Unlimited | 20 |
| Team ($149/mo) | 240 | Unlimited | 50 |

**Circuit breakers** (via `opossum` library) wrap all external API calls. When SP-API or Keepa error rates exceed 50% over 10 requests, the circuit opens for 30 seconds and falls back to cached data. Retry logic uses exponential backoff with jitter: `delay = min(base × 2^attempt, maxDelay) × (0.8 + random × 0.4)`.

**WebSocket architecture** uses Socket.IO with the Redis adapter for horizontal scaling across ECS instances. Primary use cases: bulk analysis progress streaming (SSE for unidirectional), live notifications (WebSocket for bidirectional with acknowledgment), real-time price alerts. ALB sticky sessions (cookie-based) maintain WebSocket affinity. Practical limit: **10K–30K connections per Node.js instance**.

---

## 4. Chrome extension architecture on Manifest V3

### Service worker lifecycle and the 30-second problem

MV3 service workers terminate after **30 seconds of inactivity**. For a sourcing extension, this is manageable — the typical flow is: content script detects product page → sends message to service worker → service worker makes API calls (which reset the timer) → returns results. The service worker should be designed **stateless**: persist all state in `chrome.storage.session` (ephemeral, ~10MB) or `chrome.storage.local` (persistent, unlimited with `unlimitedStorage` permission).

For long-running operations like bulk list analysis, use the **offscreen document pattern**:

```javascript
// Service worker creates offscreen document for heavy processing
await chrome.offscreen.createDocument({
  url: 'offscreen.html',
  reasons: ['BLOBS'],
  justification: 'Process bulk product analysis'
});
```

The offscreen document runs independently and periodically pings the service worker via `chrome.runtime.sendMessage({ keepAlive: true })` every 20 seconds. Active Port connections (via `chrome.runtime.connect`) also extend service worker lifetime since Chrome 116.

### Content script injection and ASIN extraction

Content scripts inject at `document_idle` to avoid blocking Amazon's page render. ASIN extraction uses a **prioritized multi-strategy approach** — URL regex first (sub-1ms), then canonical link, then DOM fallback:

```javascript
function extractASIN() {
  // Strategy 1: URL pattern (fastest)
  const match = location.pathname.match(
    /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/
  );
  if (match) return match[1];
  
  // Strategy 2: Canonical link
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    const m = canonical.href.match(/\/dp\/([A-Z0-9]{10})/);
    if (m) return m[1];
  }
  
  // Strategy 3: Hidden input or data attribute
  const input = document.querySelector('input[name="ASIN"]');
  if (input) return input.value;
  return document.querySelector('[data-asin]')?.dataset.asin;
}
```

**SPA navigation detection** is critical because Amazon uses History API pushState for product-to-product navigation without full page reloads. The content script monitors URL changes via a MutationObserver on the `<title>` element combined with a 1-second polling fallback. History API interception requires a separate script injected into the `MAIN` world.

### UI architecture: hybrid overlay + side panel

The recommended approach is a **compact Shadow DOM overlay** injected directly into Amazon pages showing key metrics (BSR, profit, ROI, deal score) at a glance, with an **expand button** that opens the Chrome Side Panel for full analysis. The overlay uses `attachShadow({ mode: 'open' })` with `:host { all: initial; }` to completely isolate styles from Amazon's CSS. Use **Preact** (~3KB) rather than full React for the content script overlay to minimize bundle impact.

The side panel (`chrome.sidePanel`) persists across navigations and hosts the React app with detailed analysis views, charts, deal pipeline access, and settings. Content script → service worker communication uses `chrome.runtime.sendMessage` for request-response patterns and `chrome.runtime.connect` (Port API) only when streaming progress updates.

**Performance targets:** Content script parse/compile under **20ms**, ASIN extraction under **1ms** (URL regex), overlay injection under **10ms** (Shadow DOM creation), total First Contentful Paint impact under **50ms**, zero network requests during page load (API calls happen asynchronously after injection).

### Manifest configuration

Required permissions: `storage`, `unlimitedStorage`, `sidePanel`, `alarms`, `scripting`, `activeTab`. Host permissions cover all Amazon TLD variants (`https://*.amazon.com/*`, `*.amazon.co.uk/*`, etc.) plus eBay domains and the tool's own API domain. Content scripts match specific product page URL patterns (`/dp/*`, `/gp/product/*`, `/itm/*`) rather than broad wildcards to minimize injection overhead.

---

## 5. Mobile app architecture with React Native + Expo

### Framework decisions and project structure

**Expo SDK 55 with development builds** (CNG — Continuous Native Generation) is the recommended approach. The New Architecture (Fabric, TurboModules, JSI) is mandatory from RN 0.82 — it cannot be disabled. Key native libraries (VisionCamera, WatermelonDB, BLE) all work via Expo config plugins and `npx expo prebuild`. File-based routing through **Expo Router v4** (built on React Navigation v7) provides automatic deep links, typed routes, and bundle splitting.

The camera scan screen should be the **default tab** — sellers launch the app and immediately see the camera. Navigation uses a tab layout with Scan (default), History, Lists, and Settings tabs.

### Barcode scanning: VisionCamera + ML Kit

**react-native-vision-camera v4** with `@mgcrea/vision-camera-barcode-scanner` (ML Kit on Android, Apple Vision on iOS) is the recommended stack. Scandit's superior accuracy in damaged/poor-lighting conditions does not justify its **$150–300+/device/year** pricing for a consumer app. ML Kit provides excellent accuracy for standard retail UPC/EAN/ISBN barcodes at **zero cost**.

Frame processors run on a parallel camera thread at 30–60 FPS via JSI worklets with approximately **1ms overhead per call**. ML Kit barcode detection adds **5–15ms per frame**, well within the 33ms budget at 30 FPS. A **500ms throttle** between scans prevents duplicate processing.

Supported formats cover all FBA-relevant barcodes: UPC-A, UPC-E, EAN-13, EAN-8, ISBN (EAN-13 with 978/979 prefix), Code 128, Code 39, and QR codes.

### Offline-first with WatermelonDB

**WatermelonDB** provides the offline data layer — it offers reactive observables (auto re-render on data change), a model layer with decorators, built-in sync protocol, and lazy loading for large datasets. Queries on indexed columns return in **under 1ms** via JSI-backed synchronous SQLite operations.

The local schema mirrors the server schema for products, scan records, price history snapshots, and scan lists. The **sync protocol** uses a pull-push mechanism: `pullChanges` fetches server changes since `lastPulledAt`, `pushChanges` sends local creates/updates/deletes. Conflict resolution follows: **server wins for product data** (authoritative pricing), **client wins for scan records** (user's local data is truth), **last-write-wins with timestamps for lists**.

**Caching strategy:** Hot cache holds the last **1,000 scanned products** with full data (~5–10MB). Warm cache pre-loads top 100K products by sales rank per popular category (~50–100MB) during WiFi connections. Cold lookups trigger API calls, with results cached immediately.

### Bluetooth barcode scanner support

External Bluetooth scanners in **HID mode** (Human Interface Device) are simplest — the scanner acts as a Bluetooth keyboard, and data arrives as keyboard input. A hidden `TextInput` with auto-focus captures scanner input with a 50ms debounce to assemble the full barcode string. This requires zero SDK integration and works universally with Koamtac KDC280 (~$250–350), Socket Mobile S740 (~$350–450), and Opticon OPN-2006 (~$150–200).

For Socket Mobile scanners specifically, the official `react-native-capture` SDK provides deeper integration (battery status, symbology control) and supports the New Architecture.

### Background sync and notifications

Background sync uses `expo-background-fetch` with `expo-task-manager`. iOS allows approximately **30 seconds of execution** per wake event at system-determined intervals (minimum ~15 minutes). Android's WorkManager is more reliable with configurable intervals and `startOnBoot: true`. The sync task processes: pending scan record uploads, stale product data refresh, and price alert checks.

Push notifications use **expo-notifications** (foreground handling) + **Firebase Cloud Messaging** (delivery). Notification types include price drop alerts (HIGH priority), deal alerts (MAX priority with custom vibration), restock alerts (MEDIUM), and silent sync-complete notifications.

---

## 6. ML/AI pipeline for deal scoring

### Feature engineering: what goes into the score

The deal scorer ingests approximately **25 features** across four groups:

**Profitability features:** ROI (normalized as z-score within category), net profit per unit (after all fees), profit margin percentage. Target thresholds: 50%+ ROI for wholesale, 30%+ for arbitrage.

**Demand/velocity features:** BSR percentile (BSR / total ASINs in category — **Top 0.5% = fast seller**), BSR trend slope (linear regression over 30/90/180 days; negative slope = improving), BSR drop count over 30/90 days (each drop ≈ minimum 1 sale), estimated monthly units, review velocity (new reviews in 30 days / total reviews).

**Competition features:** FBA seller count (3–15 = moderate; >15 = fierce price wars), Buy Box stability (percentage of time held by single seller), Amazon in-stock rate (when Amazon sells, margins compress), price coefficient of variation over 90 days.

**Risk features:** IP risk score (brand complaint database lookup + LLM assessment), category gating status, hazmat/oversize/meltable flags, seasonality index (current BSR / annual average BSR).

**Cross-category normalization** is essential — BSR 1,000 in Electronics represents vastly different sales velocity than BSR 1,000 in Books. All BSR features use **log-transformed percentile rank** rather than raw values: `log(1 - BSR/total_ASINs)`.

### Sales estimation from BSR

The BSR-to-sales relationship follows an **inverse power law**: `estimated_sales = C × BSR^(-a)` where C and a are category-specific constants. Jungle Scout's AccuSales reports **84.1% accuracy**; Helium 10's XRay reports **89.6% accuracy** across 30,000 ASINs. Precision varies by BSR range: ±10–15% for BSR 1–1,000, degrading to ±20–25% for BSR 10,000–100,000.

The **BSR drop counting method** (used by Keepa) provides a minimum sales floor: count each downward movement in the BSR time series. For fast-selling products (BSR <1,000), multiple simultaneous sales per drop make this an undercount. Use both methods — power-law curve as primary estimate, BSR drops as validation signal.

Calibrate C and a per category by fitting `log(sales) = log(C) - a × log(BSR)` against known seller data from Seller Central reports using least-squares regression.

### Model architecture and training

**LightGBM** is the recommended training framework — it converges **up to 20× faster** than XGBoost via GOSS (Gradient-based One-Side Sampling) and EFB (Exclusive Feature Bundling), with equivalent accuracy. For production inference, export to **ONNX format** for 2–5ms predictions.

The landmark paper "Why Do Tree-based Models Still Outperform Deep Learning on Tabular Data?" (Grinsztajn et al., 2022) and the TabZilla benchmark (176 datasets) confirm that CatBoost ≈ XGBoost ≈ LightGBM **significantly outperform** all neural network architectures on standard tabular classification. Trees handle irrelevant features, discontinuous decision boundaries, and small datasets (10K–100K rows) far better.

**Cold start training strategy** progresses through three phases. **Phase 1** (Day 0): Deploy a rule-based heuristic scorer — ROI >50% AND BSR <100K AND sellers <15 AND no IP flags → "good deal." This serves users immediately while collecting data. **Phase 2** (Weeks 1–8): Collect implicit labels from seller behavior — products added to buy lists (weak positive), purchased (strong positive), dismissed (weak negative). Build proxy labels from multi-criteria thresholds. **Phase 3** (Week 8+): Train initial LightGBM model on 500–1,000 labeled examples (minimum viable), then activate active learning to prioritize expert labeling on samples where model confidence is 40–60%.

**SHAP explainability** is non-negotiable for seller trust. `TreeExplainer` runs in polynomial time for tree models (~10–50ms per explanation), enabling per-deal explanations: "This deal scored 92/100 because: ROI of 68% (+15 points), BSR percentile Top 2% (+12 points), only 4 FBA sellers (+8 points), BUT high price volatility (−5 points)."

### Inference architecture

**Real-time path** (<100ms): FastAPI receives request → feature engineering from Feast online store (Redis) in ~10–20ms → ONNX Runtime inference in ~2–5ms → optional SHAP explanation in ~15–30ms → total **45–75ms** including network overhead.

**Batch path** for wholesale price lists: Celery + Redis task queue → worker processes with dedicated ONNX sessions → vectorized inference at ~50ms for 1,000 items → results streamed via WebSocket or polled via job status endpoint.

**Multi-tier caching:** L1 in-memory LRU per process (~1,000 ASINs, 5-minute TTL) for Chrome extension re-queries; L2 Redis (15-minute TTL for scores, 1-hour for features) for cross-request deduplication; L3 PostgreSQL materialized views for daily pre-computed catalog scores.

### LLM integration for natural language insights

**GPT-4o-mini** generates deal summaries at **$0.0003 per deal** — given SHAP factors and product data, it produces 1–2 sentence verdicts like "Strong buy — 68% ROI with fast turnover (BSR Top 2%), but watch for seasonal demand drop in Q1." **Claude Haiku 3.5** performs brand/IP risk assessments at **$0.002 per assessment**, analyzing brand name and product title against known enforcement patterns.

Monthly LLM costs at scale: 10K deals/day = **~$165/month** (summaries + risk combined). Use tiered model routing (GPT-4o-mini for 90% of tasks), response caching by ASIN with 24-hour TTL, and OpenAI's batch API (50% discount) for non-urgent nightly processing.

---

## 7. Security, compliance, and billing

### Amazon SP-API Data Protection Policy

A sourcing tool typically does **not** need PII access (no buyer info, addresses, or orders from other sellers), which eliminates the strictest DPP requirements. General requirements still apply: **TLS 1.2+** for all API communication, **AES-128 minimum** encryption at rest (AES-256 recommended), MFA for all developer accounts, account lockout after **10 failed attempts**, and **12-month minimum log retention** (increased from 90 days in the November 2025 DPP update). Non-PII Amazon data must be deleted within **18 months**. Vulnerability scanning every 180 days and penetration testing every 365 days are mandatory.

### Authentication architecture

JWT-based with **RS256 asymmetric signing**: access tokens (15–30 minute TTL, stored in memory), refresh tokens (7–30 day TTL with single-use rotation). If a rotated refresh token is reused, the **entire token family is revoked** and re-authentication is forced — this detects token theft.

Per-platform storage: web dashboard stores refresh tokens in **HttpOnly, Secure, SameSite=Strict cookies**; Chrome extension uses `chrome.storage.session` (ephemeral) for access tokens and encrypted `chrome.storage.local` for refresh tokens; mobile stores refresh tokens in **iOS Keychain / Android EncryptedSharedPreferences**.

**RBAC permission levels:** Owner (full access + billing), Admin (all features except billing/deletion), Manager (analysis + pipelines + buy lists + team activity), VA/Scanner (scan products + add to assigned lists only). Implemented via NestJS custom guards with role decorator metadata.

### Stripe billing integration

**Plan tiers:** Free (20 lookups/day, 1 user), Starter $29/mo (200 lookups, 1 user), Professional $79/mo (unlimited lookups, 3 users, deal pipelines), Team $149/mo (unlimited, 10 users, VA management, API access), Enterprise (custom). Use **Stripe Checkout Sessions** for initial subscription, **Stripe Customer Portal** for self-service plan changes, and **Stripe Smart Retries** for failed payment recovery (3 retries over 14 days). Target **70–80% recovery rate** for failed payments. Enable **Stripe Tax** for automatic VAT/sales tax/GST calculation.

Webhook handling processes critical events (`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted`) in a background worker — never in the HTTP request cycle. Verify webhook signatures and implement idempotency by storing processed event IDs.

### GDPR compliance

Implement data subject rights endpoints: `GET /api/v1/user/data-export` (Right to Access, machine-readable JSON), `DELETE /api/v1/user/delete-account` (Right to Deletion — soft-delete with 30-day grace, then cascade hard-delete across all tables, cancel Stripe subscription, anonymize analytics). The Chrome extension requires a published privacy policy URL in the Chrome Web Store dashboard, Limited Use disclosure if accessing sensitive data, and certification that data is not sold to brokers.

---

## 8. Scalability, caching, and performance architecture

### Multi-layer caching strategy

**Layer 1 — CDN (CloudFront):** Cache static assets (extension builds, dashboard JS/CSS, product images) at edge locations. Set `Cache-Control: public, max-age=31536000` for versioned assets.

**Layer 2 — Redis:** Product data as Redis hashes (`HSET product:{asin} title "..." buyBoxPrice 2999 bsr 5000`) with data-type-specific TTLs. Sorted sets for leaderboards (top deals by score). Rate limiting counters via sliding window Lua scripts. Estimated memory: **~500 bytes per product hash × 1M products ≈ 500MB Redis**, plus ~200MB for sessions/counters/queues = **~700MB total** at 1M product scale.

**Layer 3 — Application:** Per-process LRU cache for hot product data (last 1,000 lookups, 5-minute TTL). Response-level caching via NestJS `CacheInterceptor` with Redis backing.

**Cache invalidation** combines TTL-based expiry with event-driven invalidation. SP-API `ANY_OFFER_CHANGED` notifications immediately invalidate pricing cache for affected ASINs. **Stale-while-revalidate** pattern: serve cached data immediately while asynchronously refreshing in background, preventing user-facing latency spikes.

### Message queue architecture

**BullMQ** (Redis-backed) handles all asynchronous processing:

- **bulk-analysis** queue: Wholesale price list processing, priority by plan tier (paid > free), 10-minute timeout per job, results streamed via WebSocket
- **data-refresh** queue: Background product data refresh for popular ASINs, low priority, rate-limited to stay within SP-API/Keepa budgets
- **notifications** queue: Price alert evaluation and push notification delivery, medium priority
- **reports** queue: Profit/loss report generation, export to CSV/PDF

Dead letter queues capture jobs that fail after 3 retry attempts for manual inspection. Worker scaling: start with 2 workers per queue, auto-scale based on queue depth via CloudWatch alarms triggering ECS service scaling.

### Auto-scaling and cost optimization

**ECS Fargate auto-scaling** triggers at **70% CPU** or **80% memory** utilization, scaling from 2 to 16 tasks for the API service. The ML service scales independently. Use **Fargate Spot** for non-critical queue workers (up to 70% cost savings). Aurora Serverless v2 auto-scales between **0.5 and 128 ACUs** based on connection count and CPU — no manual scaling decisions needed.

**Estimated monthly AWS costs:**

| Scale | API Compute | ML Compute | Database | Cache | Other | Total |
|---|---|---|---|---|---|---|
| 100 users | $35 | $20 | $50 | $15 | $80 | **~$200/mo** |
| 1,000 users | $150 | $80 | $200 | $65 | $155 | **~$650/mo** |
| 10,000 users | $600 | $300 | $800 | $250 | $475 | **~$2,425/mo** |

AWS Savings Plans (1-year commit) reduce compute costs by **20–52%**. Total first-year infrastructure cost at 1,000 users including SP-API fees ($1,400/year), Keepa ($3,000–6,000/year), and AWS (~$7,800/year): approximately **$12,200–$15,200**.

### Performance targets

| Operation | Target | How achieved |
|---|---|---|
| Single product analysis (cold) | <2 seconds | Parallel SP-API batch calls + Keepa lookup + ML scoring |
| Single product analysis (cached) | <500ms | Redis hash lookup + cached ML score |
| Chrome extension overlay render | <50ms FCP impact | URL-based ASIN detection, async API call, Shadow DOM |
| Mobile barcode scan → result | <100ms local + <2s API | ML Kit at 30 FPS, WatermelonDB <1ms, parallel API calls |
| Bulk list (1,000 items) | <60 seconds | Vectorized ONNX batch (50ms) + parallel API batches |
| Database query (product by ASIN) | <5ms | Composite index on (asin, marketplace_id) |

---

## Conclusion: the architectural bets that matter most

Three decisions will most significantly determine this platform's success or failure. **First, the SP-API billing optimization** — the difference between POST-based unmetered endpoints and metered GET calls can reduce API costs by 60–80%, and this advantage compounds with scale. Building the entire analysis pipeline around batch POST endpoints (`getCompetitiveSummary`, `getMyFeesEstimates`) is the single highest-leverage architectural decision.

**Second, the shared product cache** is what separates a viable SaaS from an unsustainable one. When 1,000 sellers analyze the same popular ASIN, the backend should make exactly one set of API calls and serve cached results to all. The multi-layer caching architecture (Redis hashes with TTL-appropriate freshness guarantees, backed by TimescaleDB continuous aggregates for historical data) makes this possible.

**Third, the cold-start ML strategy** — launching with rule-based heuristic scoring on Day 0, collecting implicit labels from seller behavior, and progressively training LightGBM models creates a flywheel that competitors who rely solely on static rules cannot match. The SHAP-powered explanations and LLM-generated deal summaries differentiate the product while the underlying model improves continuously.

The eBay sold data limitation (Marketplace Insights API restriction) is the primary unresolved risk. Apply for access immediately, build the Terapeak-based fallback, and architect the eBay data layer to accept pluggable data sources as the access landscape evolves.