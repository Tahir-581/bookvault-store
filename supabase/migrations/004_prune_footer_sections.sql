-- Prune footer: remove Careers, Make Money with Us, Payment Methods, and subsidiaries
UPDATE store_settings SET value = '{
  "columns": [
    {"title":"Get to Know Us","links":[{"label":"About Us","href":"/pages/about"},{"label":"Sustainability","href":"/pages/about"}]},
    {"title":"Let Us Help You","links":[{"label":"Track Packages or View Orders","href":"/account/orders"},{"label":"Delivery Rates & Policies","href":"/pages/help"},{"label":"Returns & Replacements","href":"/pages/returns"},{"label":"Customer Service","href":"/pages/help"},{"label":"Accessibility","href":"/pages/help"}]}
  ],
  "legalLinks": [
    {"label":"Conditions of Use & Sale","href":"/pages/help"},
    {"label":"Privacy Notice","href":"/pages/about"},
    {"label":"Cookies Notice","href":"/pages/about"},
    {"label":"Interest-Based Ads Notice","href":"/pages/about"}
  ],
  "copyright": "© 1996-2026, Ilfaaz. All rights reserved."
}'::jsonb
WHERE key = 'footer';
