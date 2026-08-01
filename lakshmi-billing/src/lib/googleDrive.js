// "Save to Google Drive" — Option B: entirely browser-side, no backend.
//
// Uses Google Identity Services' OAuth2 token client to get a short-lived
// access token via a sign-in popup (you sign in as yourself, once per
// session), then calls the Drive REST API directly from the browser with
// that token. Nothing secret ever touches this app's code or a server —
// the trade-off (vs. a server-side service account) is that the token
// expires after roughly an hour, so you may occasionally see the Google
// sign-in popup again if you haven't used it in a while. See
// google-drive/SETUP.md for the one-time Google Cloud setup this needs.
//
// Scope used is drive.file — this app can only see/manage files *it*
// creates, never your existing Drive contents.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const FOLDER_NAME = "Lakshmi Billing PDFs";

export const googleDriveConfigured = !!CLIENT_ID;

let gisLoaded = null;
let tokenClient = null;
let cachedToken = null; // { access_token, expiresAt }

function loadGisScript() {
  if (gisLoaded) return gisLoaded;
  gisLoaded = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Google's sign-in script — check your connection."));
    document.head.appendChild(script);
  });
  return gisLoaded;
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error("Google Drive isn't set up yet — see google-drive/SETUP.md."));
      return;
    }
    if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
      resolve(cachedToken.access_token);
      return;
    }
    loadGisScript()
      .then(() => {
        tokenClient =
          tokenClient ||
          window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPE,
            callback: () => {}, // overridden per-request below
          });
        tokenClient.callback = (resp) => {
          if (resp.error) {
            reject(new Error(resp.error_description || "Google sign-in was cancelled or failed."));
            return;
          }
          cachedToken = { access_token: resp.access_token, expiresAt: Date.now() + resp.expires_in * 1000 };
          resolve(resp.access_token);
        };
        tokenClient.requestAccessToken({ prompt: cachedToken ? "" : "consent" });
      })
      .catch(reject);
  });
}

async function driveFetch(url, token, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Google Drive request failed (${res.status})`);
  }
  return res.json();
}

let folderIdCache = null;

async function getOrCreateFolder(token) {
  if (folderIdCache) return folderIdCache;

  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const found = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, token);
  if (found.files?.length) {
    folderIdCache = found.files[0].id;
    return folderIdCache;
  }

  const created = await driveFetch("https://www.googleapis.com/drive/v3/files", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  folderIdCache = created.id;
  return folderIdCache;
}

// Uploads a PDF Blob to a "Lakshmi Billing PDFs" folder in your own Drive,
// makes it link-viewable ("Anyone with the link can view"), and returns
// that shareable link.
export async function uploadPdfToDrive(blob, filename) {
  const token = await getAccessToken();
  const folderId = await getOrCreateFolder(token);

  const metadata = { name: filename, parents: [folderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);

  const uploaded = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    token,
    { method: "POST", body: form }
  );

  // Share "anyone with the link can view" so the link is usable outside
  // your own Google account (e.g. sending it to a customer).
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${uploaded.id}/permissions`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return uploaded.webViewLink;
}
