import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TenantAuthProvider, configureBeacon } from '@beacon/tenant-ui';
import api, { setAuthToken } from './services/api';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const PLATFORM_API_URL = import.meta.env.VITE_PLATFORM_API_URL || import.meta.env.VITE_API_URL || '';

if (!PUBLISHABLE_KEY || !PLATFORM_API_URL) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <div style={{ padding: '2rem', maxWidth: 600, fontFamily: 'system-ui' }}>
      <h1>Beacon App (Min)</h1>
      <p>Beacon layout requires these environment variables:</p>
      <ul>
        <li><strong>VITE_CLERK_PUBLISHABLE_KEY</strong> — Same Clerk key as the Beacon platform</li>
        <li><strong>VITE_PLATFORM_API_URL</strong> — Platform API URL (e.g. https://beacon-api-xxx.onrender.com)</li>
      </ul>
      <p>Set them in <code>.env</code> for local dev, or in Render → frontend service → Environment.</p>
      <p>See <a href="https://github.com/RankinCo-Services/beacon-app-min/blob/main/docs/ADDING_BEACON_LAYOUT.md">ADDING_BEACON_LAYOUT.md</a> for details.</p>
    </div>
  );
} else {
  configureBeacon({
    api,
    setAuthToken,
    apiBaseUrl: PLATFORM_API_URL,
    app: { name: 'Beacon App' },
    afterCreateTenantPath: '/',
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <TenantAuthProvider
        publishableKey={PUBLISHABLE_KEY}
        api={api}
        setAuthToken={setAuthToken}
        afterSignInUrl="/tenants"
        afterSignUpUrl="/tenants"
      >
        <App />
      </TenantAuthProvider>
    </BrowserRouter>
  );
}
