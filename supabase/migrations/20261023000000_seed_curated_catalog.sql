-- Seed the existing, hand-curated Shrugr set as published records.
-- Safe to re-run: film rows and collection links are upserted by stable slugs/keys.
insert into public.films (
  slug, tmdb_id, title, release_year, runtime_minutes, poster_path, overview, genres,
  moods, delivery, visual, interruption, providers, note, reason, status
) values
  ('the-grand-budapest-hotel', 120467, 'The Grand Budapest Hotel', 2014, 100, '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', 'The Grand Budapest Hotel tells of a legendary concierge at a famous European hotel between the wars and his friendship with a young employee who becomes his trusted protégé. The story involves the theft and recovery of a priceless Renaissance painting, the battle for an enormous family fortune and the slow and then sudden upheavals that transformed Europe during the first half of the 20th century.', array['Comedy','Drama'], array['unwind','feel']::public.film_mood[], array['simple','hooked']::public.film_delivery[], array['composed','energy']::public.film_visual[], 4, array['Disney+','Prime Video'], 'Let the details wash over you. This little storybook has a place for every wandering thought.', 'A playful, chaptered story with a world you can sink into without working too hard.', 'published'),
  ('knives-out', 546554, 'Knives Out', 2019, 131, '/pThyQovXQrw2m0s9x82twj48Jq4.jpg', 'When renowned crime novelist Harlan Thrombey is found dead at his estate just after his 85th birthday, the inquisitive and debonair Detective Benoit Blanc is mysteriously enlisted to investigate. From Harlan''s dysfunctional family to his devoted staff, Blanc sifts through a web of red herrings and self-serving lies to uncover the truth behind Harlan''s untimely death.', array['Comedy','Crime','Mystery'], array['hyped','learn','feel']::public.film_mood[], array['hooked','simple']::public.film_delivery[], array['composed','energy']::public.film_visual[], 4, array['Netflix','Prime Video'], 'You don''t have to solve it before Benoit Blanc does. Just enjoy the deliciously messy family along the way.', 'Quick dialogue and a satisfying mystery keep the evening moving.', 'published'),
  ('arrival', 329865, 'Arrival', 2016, 116, '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg', 'Taking place after alien crafts land around the world, an expert linguist is recruited by the military to determine whether they come in peace or are a threat.', array['Drama','Science Fiction','Mystery'], array['feel','escape','learn']::public.film_mood[], array['soak','brain']::public.film_delivery[], array['grounded','raw']::public.film_visual[], 3, array['Paramount+','Prime Video'], 'You can let the questions stay questions for a while. Pay attention to how it feels, and the pieces will find each other.', 'A thoughtful, immersive pace matches a curious mood and a little breathing room.', 'published'),
  ('spider-man-into-the-spider-verse', 324857, 'Spider-Man: Into the Spider-Verse', 2018, 117, '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', 'Struggling to find his place in the world while juggling school and family, Brooklyn teenager Miles Morales is unexpectedly bitten by a radioactive spider and develops unfathomable powers just like the one and only Spider-Man.', array['Animation','Action','Adventure','Science Fiction'], array['hyped','escape','unwind']::public.film_mood[], array['hooked','simple']::public.film_delivery[], array['energy','composed']::public.film_visual[], 4, array['Disney+','Netflix'], 'No need to catch every frame. Let the color and the music do their thing—you''ll find your way into it.', 'Big visual energy, clear stakes, and a joyful pace make this an easy yes.', 'published'),
  ('chef', 212778, 'Chef', 2014, 114, '/hyp8EXDmO4dSC8V6Q5jU7gD1kcg.jpg', 'A chef who loses his restaurant job starts a food truck with his young son and rediscovers his creativity on the road.', array['Comedy','Drama'], array['unwind','feel']::public.film_mood[], array['simple','soak']::public.film_delivery[], array['raw','grounded']::public.film_visual[], 5, array['Netflix','Prime Video'], 'Take it at your own pace. This is a warm, low-stakes hangout with a very good soundtrack and no wrong way to watch.', 'A warm, linear story that feels like a deep breath after a long day.', 'published'),
  ('mad-max-fury-road', 76341, 'Mad Max: Fury Road', 2015, 121, '/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg', 'An apocalyptic story set in the furthest reaches of our planet, where humanity is broken and two rebels are on the run.', array['Action','Adventure','Science Fiction'], array['hyped','escape']::public.film_mood[], array['hooked']::public.film_delivery[], array['energy','raw']::public.film_visual[], 3, array['Max','Prime Video'], 'Settle in and let the momentum carry you. The story is in the movement as much as the words.', 'Pure forward motion for when you want your attention completely captured.', 'published'),
  ('perfect-blue', 10494, 'Perfect Blue', 1998, 81, '/6WTiOCfDPP8XV4jqfloiVWf7KHq.jpg', 'Rising pop star Mima Kirigoe quits singing to pursue a career as an actress. As people around her are murdered, her reality and fantasy meld into a frenzied paranoia.', array['Animation','Thriller'], array['escape','feel']::public.film_mood[], array['brain','hooked']::public.film_delivery[], array['composed','energy']::public.film_visual[], 2, array['MUBI','Criterion'], 'Don''t worry about pinning down what''s real right away. Let the unease settle in and trust the film to take you somewhere.', 'A compact, mind-bending watch with a carefully controlled visual world.', 'published'),
  ('before-sunrise', 76, 'Before Sunrise', 1995, 101, '/kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg', 'An unexpected meeting on a train leads two travelers to spend an evening wandering through Vienna, sharing stories and exploring ideas as a quiet intimacy grows.', array['Drama','Romance'], array['feel','unwind']::public.film_mood[], array['soak']::public.film_delivery[], array['grounded','raw']::public.film_visual[], 4, array['Criterion','Prime Video'], 'There''s nowhere else to be. Just walk along with them and let the conversation take the scenic route.', 'An intimate, unhurried conversation that rewards a relaxed evening.', 'published'),
  ('the-social-network', 37799, 'The Social Network', 2010, 121, '/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg', 'In 2003, Harvard undergrad and computer programmer Mark Zuckerberg begins work on a new concept that leads to personal and legal complications.', array['Drama'], array['hyped','learn']::public.film_mood[], array['hooked']::public.film_delivery[], array['composed','raw']::public.film_visual[], 3, array['Netflix','Prime Video'], 'You don''t need to keep score of every sharp exchange. Let the rhythm of the conversation pull you along.', 'Relentless dialogue and brisk scenes make a smart story feel electric.', 'published'),
  ('paddington-2', 346648, 'Paddington 2', 2017, 104, '/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg', 'Paddington, now happily settled with the Browns, picks up odd jobs to buy the perfect present for his Aunt Lucy, but it is stolen.', array['Adventure','Comedy','Family'], array['unwind','feel']::public.film_mood[], array['simple']::public.film_delivery[], array['composed','grounded']::public.film_visual[], 5, array['Max','Netflix'], 'You are allowed to enjoy something kind. Let this be a small, marmalade-scented reset.', 'A bright, beautifully clear story with a generous heart and gentle stakes.', 'published'),
  ('everything-everywhere-all-at-once', 545611, 'Everything Everywhere All at Once', 2022, 140, '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg', 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what''s important to her by connecting with lives she could have led in other universes.', array['Action','Adventure','Science Fiction'], array['escape','feel','hyped']::public.film_mood[], array['brain','hooked']::public.film_delivery[], array['energy','raw']::public.film_visual[], 2, array['Showtime','Prime Video'], 'It gets gloriously chaotic. You don''t have to hold every universe in your head—follow the feeling back home.', 'A maximalist, shape-shifting ride for when you want to be fully transported.', 'published'),
  ('lost-in-translation', 153, 'Lost in Translation', 2003, 102, '/3jCLmYDIIiSMPujbwygNpqdpM8N.jpg', 'Two lost souls visiting Tokyo find an odd solace and pensive freedom away from their lives in America.', array['Drama','Comedy','Romance'], array['unwind','feel']::public.film_mood[], array['soak']::public.film_delivery[], array['grounded','raw']::public.film_visual[], 4, array['MUBI','Prime Video'], 'You don''t have to name the feeling. Sit in the in-between with them for a little while.', 'Quiet, atmospheric, and unhurried—a soft landing for a low-key night.', 'published')
on conflict (slug) do update set
  tmdb_id = excluded.tmdb_id,
  title = excluded.title,
  release_year = excluded.release_year,
  runtime_minutes = excluded.runtime_minutes,
  poster_path = excluded.poster_path,
  overview = excluded.overview,
  genres = excluded.genres,
  moods = excluded.moods,
  delivery = excluded.delivery,
  visual = excluded.visual,
  interruption = excluded.interruption,
  providers = excluded.providers,
  note = excluded.note,
  reason = excluded.reason,
  status = excluded.status;

insert into public.editorial_collections (slug, title, description, intro, status) values
  ('movies-under-two-hours', 'Movies under two hours', 'A curated set of movies under two hours for a complete story that leaves a little more room in your evening.', 'A shorter runtime can still leave room for a big feeling. These curated picks are all under two hours, with distinct moods and styles to choose from.', 'published'),
  ('warm-movies-to-unwind', 'Warm movies to unwind with', 'Gentle, feel-good movie picks for a softer landing at the end of the day.', 'When the day has taken enough out of you, a warm and welcoming story can help you settle in. Start with one of these curated picks.', 'published'),
  ('thoughtful-sci-fi-movies', 'Thoughtful science-fiction movies', 'Curious, transporting science-fiction picks with ideas and atmosphere to stay with you.', 'For a night when you want to leave the everyday behind and bring back a question or two, these science-fiction stories offer different kinds of wonder.', 'published')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  intro = excluded.intro,
  status = excluded.status;

with collection_members(slug, film_slug, position) as (
  values
    ('movies-under-two-hours', 'perfect-blue', 0),
    ('movies-under-two-hours', 'the-grand-budapest-hotel', 1),
    ('movies-under-two-hours', 'before-sunrise', 2),
    ('movies-under-two-hours', 'arrival', 3),
    ('movies-under-two-hours', 'chef', 4),
    ('movies-under-two-hours', 'paddington-2', 5),
    ('movies-under-two-hours', 'lost-in-translation', 6),
    ('warm-movies-to-unwind', 'chef', 0),
    ('warm-movies-to-unwind', 'paddington-2', 1),
    ('warm-movies-to-unwind', 'the-grand-budapest-hotel', 2),
    ('thoughtful-sci-fi-movies', 'arrival', 0),
    ('thoughtful-sci-fi-movies', 'everything-everywhere-all-at-once', 1)
)
insert into public.editorial_collection_films (collection_id, film_id, position)
select c.id, f.id, m.position
from collection_members m
join public.editorial_collections c on c.slug = m.slug
join public.films f on f.slug = m.film_slug
on conflict (collection_id, film_id) do update set position = excluded.position;
