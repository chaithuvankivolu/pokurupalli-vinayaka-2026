# Pokurupalli Vinayaka Chaviti 2026

V14 fixes the schedule loading flow, uses India time for today's events, shows all upcoming events instead of only four, and keeps Day 1/2/3 calculated from the actual event date.


## V15 updates
- Schedule grouped by actual festival date (Day 1, Day 2, Day 3).
- All events for the same day appear together in one card.
- Today's Events shows the actual day/date header.
- Existing Supabase event data and event-specific icons/images are retained.


## V19 gallery fix
Run `public_photo_policy.sql` in the Supabase SQL Editor. This adds the public SELECT policy required for the website to retrieve only rows where `status = 'approved'`.

The public gallery now shows a clear empty/error message instead of remaining on Loading, and keeps the upload tile visible.
