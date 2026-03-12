-- Adiciona coluna modalidade_entrega à tabela courses
-- Valores aceitos: 'ead' | 'semipresencial'
-- Default: 'ead' (retrocompatível com dados existentes)

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS modalidade_entrega TEXT
    CHECK (modalidade_entrega IN ('ead', 'semipresencial'))
    DEFAULT 'ead' NOT NULL;

-- Atualiza registros já existentes de acordo com a lógica anterior de inferência:
-- Licenciatura → semipresencial
UPDATE courses SET modalidade_entrega = 'semipresencial' WHERE modalidade = 'licenciatura';

-- Educação Física (bacharelado) → semipresencial
UPDATE courses
SET modalidade_entrega = 'semipresencial'
WHERE modalidade = 'bacharelado'
  AND nome_curso ILIKE '%educa_ao f_sica%';
