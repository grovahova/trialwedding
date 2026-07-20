-- Sets the event lineup to: Sangeet, Haldi, Mehendi, Wedding (in that order).
-- Safe to re-run.

-- 1) Rename the default "Nikah" event to "Wedding" — keeps all tasks/budget/
--    shopping already attached to it, just renames the label.
update events set name = 'Wedding' where slug = 'nikah';

-- 2) Add "Sangeet" as a new event, only if it doesn't already exist.
insert into events (name, slug, color_theme, position)
select 'Sangeet', 'sangeet', 'mehendi-gradient', 0
where not exists (select 1 from events where lower(name) = 'sangeet');

-- 3) Set the exact display order.
update events set position = 1 where lower(name) = 'sangeet';
update events set position = 2 where slug = 'haldi';
update events set position = 3 where slug = 'mehendi';
update events set position = 4 where slug = 'nikah'; -- now named "Wedding"

-- 4) "Walima / Reception" isn't in this lineup — archive it (data kept,
--    restorable anytime from Events -> Archived Events).
update events set status = 'archived' where slug = 'reception';
