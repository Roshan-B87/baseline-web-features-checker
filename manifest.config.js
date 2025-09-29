import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Baseline webfeatures checker',
  version: '1.0.0',
  action: {
    default_popup: 'index.html',
  },
   "icons": {
    "16": "public/Logo1.png",
    "32": "public/Logo1.png",
    "48": "public/Logo1.png",
    "128": "public/Logo1.png"
  },
   "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
   "background": {
    "service_worker": "background.js"
  },
  "permissions": [
    "activeTab",
    "tabs",
    "contextMenus",
    "storage"
  ],
  "host_permissions": [
    "https://api.webstatus.dev/*"
  ]
});
