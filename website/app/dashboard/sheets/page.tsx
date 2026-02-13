'use client';

import { Fieldset } from '@/components/dashboard/Fieldset';

export default function SheetsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-1">Google Account Connection</h1>
        <p className="text-text-muted text-sm">
          Connect your Google account to export data to Google Sheets.
        </p>
      </div>

      <Fieldset title="Google Account">
        <p className="text-text-muted text-sm mb-4">
          Connect your Google account to enable automatic export of your product analysis
          data to Google Sheets. This allows you to track products, compare deals, and
          share findings with your team.
        </p>
        <button className="btn-gradient text-white text-sm font-medium px-4 py-2">
          Connect Google Account
        </button>
      </Fieldset>
    </div>
  );
}
