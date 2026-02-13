'use client';

import { Fieldset } from '@/components/dashboard/Fieldset';

const integrations = [
  {
    name: 'Google Sheets',
    description: 'Export your product analysis data directly to Google Sheets for easy tracking and collaboration.',
    connectLabel: 'Connect to Google',
    signupUrl: 'https://accounts.google.com/signup',
  },
  {
    name: 'Keepa',
    description: 'Access historical Amazon price and BSR data powered by Keepa for deeper product insights.',
    connectLabel: 'Connect to Keepa',
    signupUrl: 'https://keepa.com/#!register',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-1">Integrations</h1>
        <p className="text-text-muted text-sm">
          Connect third-party services to enhance your sourcing workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <Fieldset key={item.name} title={item.name}>
            <p className="text-text-muted text-sm mb-4">{item.description}</p>
            <div className="flex items-center gap-3">
              <button className="btn-gradient text-white text-sm font-medium px-4 py-2">
                {item.connectLabel}
              </button>
              <a
                href={item.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent text-sm hover:underline"
              >
                Sign-up
              </a>
            </div>
          </Fieldset>
        ))}
      </div>
    </div>
  );
}
