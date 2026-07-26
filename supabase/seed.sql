-- Ochre Morocco / initial catalogue
-- Run supabase/schema.sql first, then run this file once.
-- Existing local image paths are intentionally preserved. They continue to work
-- until an administrator replaces them with a Supabase Storage upload.

insert into public.excursions
  (title, slug, description, price, duration, category, image_url, is_active)
values
  ('Airport Transfer – Hotel ↔ Airport', 'airport-transfer', 'Private vehicle, hotel pickup and drop-off between Marrakech and the airport.', 5, '30–60 min', 'transfert', 'assets/images/vehicule-berline-aeroport.jpg', true),
  ('Agafay Desert Pack – Quad + Camel Ride + Dinner Show', 'agafay-desert-pack', 'Quad, camel ride and a traditional dinner show in the Agafay Desert.', 25, 'Half day', 'excursion', 'assets/images/agafay-quad-caravane.jpg', true),
  ('Hot Air Balloon – Moroccan Breakfast Included', 'hot-air-balloon', 'See the landscapes around Marrakech from above, followed by a Moroccan breakfast.', 89, '3–4 hours', 'excursion', 'assets/images/agafay-coucher-soleil.jpg', true),
  ('Paragliding – Stunning Atlas View', 'paragliding', 'An unforgettable flight with views across the Atlas mountains.', 80, 'Half day', 'excursion', 'assets/images/toubkal-sommet.jpg', true),
  ('Petit Buggy – Palmeraie (2 Hours)', 'petit-buggy', 'A private buggy adventure through the Marrakech palm grove.', 50, '2 hours', 'excursion', 'assets/images/agafay-buggy.jpg', true),
  ('Grand Buggy – Palmeraie (1H or 2H)', 'grand-buggy', 'Choose one or two hours of buggy driving around the Palmeraie.', 60, '1–2 hours', 'excursion', 'assets/images/agafay-buggy.jpg', true),
  ('Quad – Palmeraie de Marrakech', 'quad-palmeraie', 'Ride a quad through the palm groves with a local guide.', 20, '1–2 hours', 'excursion', 'assets/images/agafay-quad-caravane.jpg', true),
  ('Camel Ride – Palmeraie de Marrakech', 'camel-ride', 'A gentle camel ride through the Palmeraie and surrounding villages.', 15, '1–2 hours', 'excursion', 'assets/images/palmeraie-chameau.jpg', true),
  ('Essaouira – Full Day Excursion', 'essaouira', 'Spend a full day discovering the Atlantic city, medina and seafront.', 15, 'Full day', 'excursion', 'assets/images/essaouira-picnic-plage.jpg', true),
  ('Ouzoud Waterfalls – Full Day', 'ouzoud', 'Visit the famous waterfalls and enjoy the scenery of the Middle Atlas.', 15, 'Full day', 'excursion', 'assets/images/ouzoud-cascades.jpg', true),
  ('Ourika Valley – With Guide', 'ourika', 'Explore the Ourika Valley, villages and mountain paths with a guide.', 15, 'Full day', 'excursion', 'assets/images/ourika-randonnee.jpg', true),
  ('Aït Ben Haddou & Ouarzazate – Full Day', 'ait-ben-haddou', 'Discover the UNESCO ksar and the cinematic landscapes around Ouarzazate.', 25, 'Full day', 'excursion', 'assets/images/dades-gorges.jpg', true),
  ('Zagora Desert – 2 Days / 1 Night', 'zagora-desert', 'Cross the Atlas and spend a memorable night in the Zagora desert.', 55, '2 days / 1 night', 'excursion', 'assets/images/zagora-route-palmiers.jpg', true),
  ('Merzouga Desert – 3 Days / 2 Nights', 'merzouga-desert', 'Travel through kasbahs and valleys to the dunes and camps of Merzouga.', 70, '3 days / 2 nights', 'excursion', 'assets/images/merzouga-camp-coucher.jpg', true),
  ('Circuit Villes Impériales', 'villes-imperiales', 'A journey through Casablanca, Rabat, Fès and Marrakech.', 249, '7 Jours / 6 Nuits', 'circuit', 'assets/images/casablanca-hassan2.jpg', false),
  ('Circuit Désert du Sahara', 'desert-sahara', 'Cross the Atlas, the kasbahs and the Dades and Todra gorges before reaching Merzouga.', 159, '3 Jours / 2 Nuits', 'circuit', 'assets/images/desert-nuit-etoiles.jpg', true),
  ('Circuit Sud Maroc', 'sud-maroc', 'Explore palm oases, spectacular gorges, ancient kasbahs and golden dunes.', 199, '5 Jours / 4 Nuits', 'circuit', 'assets/images/dades-gorges.jpg', true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  duration = excluded.duration,
  category = excluded.category,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  updated_at = now();