-- Приведение старых категорий прайса к схеме админки
-- (fence, gates, canopy, foundation, posts, landscape, other)

UPDATE prices SET category = 'fence'  WHERE category IN ('profnastil', 'shtaketnik', 'mesh', 'kovka');
UPDATE prices SET category = 'gates'  WHERE category IN ('gate', 'wicket');