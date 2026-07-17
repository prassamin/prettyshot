-- Drop the existing constraint
ALTER TABLE public.backgrounds DROP CONSTRAINT IF EXISTS backgrounds_category_check;

-- Delete any existing 'gradient' backgrounds since we are removing that category
DELETE FROM public.backgrounds WHERE category = 'gradient';

-- Add the new constraint allowing only 'mesh' and 'image'
ALTER TABLE public.backgrounds ADD CONSTRAINT backgrounds_category_check CHECK (category IN ('mesh', 'image'));

-- Add the is_free column
ALTER TABLE public.backgrounds ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false;
