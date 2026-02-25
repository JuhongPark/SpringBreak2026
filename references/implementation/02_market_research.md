# Market Research (2026-02-25)

## Scope
- Travel-planning products/patterns focused on price tracking, trust signals, and itinerary automation.

## Sources
- KAYAK Pricing & Price Alerts: https://www.kayak.com/help/lowfares
- Expedia Price Tracking: https://www.expedia.com/es/why/price-tracking
- Expedia Flight Deals announcement (2025-02-13): https://www.expedia.com/newsroom/expedia-launches-new-flight-deals-feature/
- TripIt Inbox Sync authorization (updated 2025-12-11): https://help.tripit.com/en/support/solutions/articles/103000063336-authorizing-inbox-sync
- TripIt Inbox Sync security: https://help.tripit.com/en/support/solutions/articles/103000063317-inbox-sync-security
- Google Flights price tracking: https://www.google.com/travel/flights/saves?gl=US&hl=en-US

## Extracted patterns
1. Price transparency and change awareness
- Show historical/expected price signals and route tracking (KAYAK, Expedia, Google Flights).

2. Alert-driven workflow
- Users do not want manual refresh loops; notifications reduce decision fatigue.

3. Trust signals
- Clear caveats and quality filters (e.g., fare quality constraints, stale-price disclaimers) improve confidence.

4. Safe automation
- Itinerary import/automation must explain permissions, scope, and revocation path (TripIt Inbox Sync security model).

5. Supportability
- Good products provide explicit support channels and predictable troubleshooting paths.

## Implications for this project
- Keep planning deterministic and inspectable while exposing pricing caveats.
- Preserve a complete trace and make each planning decision replayable.
- Separate user-safe timeline from debug payload view.
