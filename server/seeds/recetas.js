/*
  Seed de recetas desde el Excel "Costos tortas 2026"
  Recibe db como parámetro para evitar circular import.
  Guarda en config 'recetas_seeded_v1' para no re-ejecutar.
  Para agregar nuevas recetas desde prompt: crear 'seedRecetasV2'.
*/
export function seedRecetas(db) {
  const yaSeeded = db.prepare("SELECT 1 FROM config WHERE clave = 'recetas_seeded_v1'").get();
  if (yaSeeded) return;

  // ── Helpers ────────────────────────────────────────────────
  // Obtiene ID de insumo por nombre exacto, lo crea si no existe
  function ins(nombre, unidad = 'kg', costo = 0) {
    const row = db.prepare('SELECT id FROM insumos WHERE nombre = ?').get(nombre);
    if (row) return row.id;
    return db.prepare('INSERT INTO insumos (nombre, unidad, costo) VALUES (?, ?, ?)').run(nombre, unidad, costo).lastInsertRowid;
  }

  // Crea receta con ingredientes: [[insumo_id, cantidad], ...]
  function receta(nombre, categoria, rendimiento, ingredientes, productoNombre = null) {
    const prodId = productoNombre
      ? db.prepare('SELECT id FROM productos WHERE nombre LIKE ?').get(`%${productoNombre}%`)?.id || null
      : null;
    const r = db.prepare('INSERT INTO recetas (nombre, categoria, producto_id, rendimiento) VALUES (?, ?, ?, ?)')
      .run(nombre, categoria, prodId, rendimiento);
    const stmt = db.prepare('INSERT INTO receta_ingredientes (receta_id, insumo_id, cantidad) VALUES (?, ?, ?)');
    for (const [id, cant] of ingredientes) {
      if (id && cant > 0) stmt.run(r.lastInsertRowid, id, cant);
    }
    return r.lastInsertRowid;
  }

  // ── Packaging (ítems transversales — aparecen al inicio) ───
  const pkgTorta  = ins('Packaging Tortas',       'u',  230);  // caja 30x30 + sticker
  const pkgMicros = ins('Packaging Micros',        'u',  107);  // foseera + blonda + caja + sticker
  const pkgLetra  = ins('Packaging Letter Cake',   'u',  100);  // tergopol + blonda + sticker

  // ── Insumos base (existentes + nuevos) ─────────────────────
  const manteca     = ins('Manteca');
  const harina      = ins('Harina 0000');
  const harinaLeu   = ins('Harina leudante Blancaflor');
  const azucar      = ins('Azúcar');
  const azucarImp   = ins('Azúcar impalpable');
  const azucarInv   = ins('Azúcar invertido');
  const ddl         = ins('DDL Repostero');
  const claras      = ins('Claras',              'u',  125);   // mitad de un huevo
  const yemas       = ins('Yemas',               'u',  125);
  const huevos      = ins('Huevos');
  const crema       = ins('Crema milkaut');
  const gelatina    = ins('Gelatina sin sabor');
  const chocolate   = ins('Chocolate Fenix');
  const casancrem   = ins('Queso crematto / casancrem');
  const finlandia   = ins('Finlandia',            'kg', 13500);
  const frutosRojos = ins('Frutos Rojos');
  const frutillas   = ins('Frutillas');
  const maracuya    = ins('Pulpa de Maracuyá');
  const coco        = ins('Coco Rallado');
  const almendras   = ins('Almendras');
  const nueces      = ins('Nueces');
  const maicena     = ins('Maicena');
  const aceite      = ins('Aceite');
  const zanahoria   = ins('Zanahorias');
  const lecheCondens= ins('Leche condensada');
  const cacaoAmargo = ins('Cacao amargo');
  const oreo        = ins('Paquete Oreo');
  const chocolinas  = ins('Paquete Chocolinas');
  const lincoln     = ins('Paquete Lincoln',      'u',  1800);
  const limas       = ins('Limas');
  const leche       = ins('Leche');

  // Nuevos insumos de las recetas
  const manzanas      = ins('Manzanas',            'kg', 5000);
  const miel          = ins('Miel',                'kg', 8000);
  const bicarbonato   = ins('Bicarbonato',         'kg', 2000);
  const polvoHornear  = ins('Polvo de hornear',    'kg', 3000);
  const esenciaVaini  = ins('Esencia de vainilla', 'u',  1500);
  const sal           = ins('Sal',                 'kg',  300);
  const pionono       = ins('Pionono',             'u',  1500); // pre-comprado
  // Base Brownie como sub-receta computable (el usuario puede sincronizar su precio)
  const baseBrownie   = ins('Base Brownie (1 receta)', 'u', 20000);

  db.exec('BEGIN');
  try {

    // ══════════════════════════════════════════════
    // SUB-RECETA: Base Brownie (usada en múltiples tortas)
    // ══════════════════════════════════════════════
    receta('Base Brownie (receta completa)', 'sub-receta', 1, [
      [huevos,    4],
      [harina,  200],
      [manteca, 150],
      [chocolate, 150],
      [azucar,  400],
    ]);

    // ══════════════════════════════════════════════
    // TORTAS
    // ══════════════════════════════════════════════

    receta('Nevada', 'tortas', 1, [
      [baseBrownie, 1],
      [ddl,    1000],
      [azucar,  300],
      [claras,    5],
      [pkgTorta,  1],
    ], 'Nevada');

    receta('Bomba', 'tortas', 1, [
      [baseBrownie, 1],
      [ddl,    1000],
      [crema,   360],
      [azucar,  300],
      [claras,    5],
      [pkgTorta,  1],
    ], 'Bomba');

    receta('Lemon Pie', 'tortas', 1, [
      [harina,   250],
      [manteca,  310],   // 110 masa + 200 relleno
      [azucar,   620],   // 120 + 200 + 300 merengue
      [huevos,     2],   // 1 masa + 1 relleno
      [yemas,      5],
      [limas,      2],
      [pkgTorta,   1],
    ], 'Lemon');

    receta('Rogel', 'tortas', 1, [
      [harina,   450],
      [sal,        3],
      [yemas,      3],
      [manteca,  105],
      [ddl,     1000],
      [claras,     3],
      [azucar,   300],
      [pkgTorta,   1],
    ]);

    receta('Crumble de Manzana', 'tortas', 1, [
      [harina,   400],   // 250 masa + 150 crumble
      [manteca,  260],   // 110 + 150
      [azucar,   270],   // 120 + 150
      [huevos,     1],
      [manzanas, 1500],
      [pkgTorta,   1],
    ], 'Crumble');

    receta('Tarta de Manzana', 'tortas', 1, [
      [harina,   300],
      [manteca,  200],
      [azucar,   100],
      [huevos,     1],
      [manzanas, 1500],
      [pkgTorta,   1],
    ]);

    receta('Mousselina de Maracuyá', 'tortas', 1, [
      [pionono,       1],
      [huevos,        5],
      [azucar,      295],  // 75 pionono + 220 mousse
      [harina,       75],
      [esenciaVaini,  1],
      [miel,          2],
      [claras,        3],
      [crema,       360],
      [gelatina,     40],  // 30 + 10
      [maracuya,    400],  // 200 relleno + 200 gelee
      [azucarInv,    20],
      [pkgTorta,      1],
    ], 'Maracuy');

    receta('Torta Oreo', 'tortas', 1, [
      [oreo,       7],
      [manteca,  150],
      [crema,    360],
      [claras,     3],
      [azucar,   180],
      [gelatina,  30],
      [ddl,     1000],
      [pkgTorta,   1],
    ], 'Oreo');

    receta('Cheese Cake', 'tortas', 1, [
      [pionono,    1],
      [casancrem, 900],
      [azucar,   100],
      [limas,      2],
      [claras,     2],
      [crema,    250],
      [gelatina,  14],
      [frutosRojos, 250],
      [pkgTorta,   1],
    ], 'Cheese Cake');

    receta('Tarta de Frutillas', 'tortas', 1, [
      [harina,   250],
      [manteca,  110],
      [azucar,   120],
      [huevos,     1],
      [ddl,      500],
      [crema,    360],
      [frutillas, 800],
      [pkgTorta,   1],
    ], 'Tarta de Frutill');

    receta('Chocotorta redonda', 'tortas', 1, [
      [chocolinas,  4],
      [ddl,      1000],
      [casancrem,  700],
      [manteca,    300],
      [leche,      250],
      [pkgTorta,     1],
    ], 'Chocotorta');

    receta('Chocotorta rectangular (grande)', 'tortas', 1, [
      [chocolinas,  6],
      [ddl,      1500],
      [casancrem, 1000],
      [manteca,    500],
      [leche,      250],
      [pkgTorta,     1],
    ]);

    receta('Mousselina de Limón', 'tortas', 1, [
      [pionono,   1],
      [claras,    3],
      [azucar,  180],
      [crema,   360],
      [gelatina,  30],
      [limas,     2],
      [pkgTorta,  1],
    ]);

    receta('Mousse de Chocolate', 'tortas', 1, [
      [baseBrownie, 1],
      [ddl,       500],
      [pkgTorta,    1],
    ], 'Mousse');

    receta('Torta de Nuez', 'tortas', 1, [
      [lincoln,    2],
      [nueces,   230],
      [manteca,  150],
      [ddl,     1000],
      [crema,    360],
      [pkgTorta,   1],
    ], 'Nuez');

    receta('Cheese Cake Cocido', 'tortas', 1, [
      [manteca,     100],
      [azucar,      350],  // 100+100+150
      [finlandia,   900],
      [crema,       280],
      [huevos,        6],
      [maicena,      94],
      [frutosRojos, 400],
      [pkgTorta,      1],
    ]);

    receta('Choco Oreo', 'tortas', 1, [
      [oreo,       6],
      [manteca,  100],
      [leche,    100],
      [ddl,     1000],
      [casancrem, 500],
      [pkgTorta,   1],
    ], 'Choco Oreo');

    receta('Carrot Cake', 'tortas', 1, [
      [huevos,       4],
      [azucar,     450],   // 350 + 100 frosting
      [aceite,     130],
      [zanahoria,  300],
      [harinaLeu,  280],
      [bicarbonato,  8],
      [crema,      360],
      [casancrem,  360],
      [pkgTorta,     1],
    ], 'Carrot');

    receta('Sablée de Almendras', 'tortas', 1, [
      [harina,      300],
      [almendras,   200],
      [azucar,       70],
      [manteca,     200],
      [huevos,        1],
      [ddl,        1000],
      [crema,       360],
      [frutosRojos, 400],
      [pkgTorta,      1],
    ], 'Sablee');

    receta('Pavlova de Frutillas', 'tortas', 1, [
      [huevos,    5],
      [azucar,  150],
      [azucarImp, 150],
      [ddl,     500],
      [crema,   360],
      [frutillas, 500],
      [pkgTorta,  1],
    ], 'Pavlova de Frutill');

    receta('Pavlova Frutos Rojos', 'tortas', 1, [
      [huevos,    5],
      [azucar,  150],
      [azucarImp, 150],
      [ddl,     500],
      [crema,   360],
      [frutosRojos, 400],
      [pkgTorta,  1],
    ], 'Pavlova Frutos');

    receta('Key Lime Pie', 'tortas', 1, [
      [harina,      250],
      [manteca,     110],
      [azucar,      120],
      [huevos,        7],  // 1 masa + 6 relleno
      [lecheCondens, 1150],
      [limas,         3],
      [pkgTorta,      1],
    ], 'Key Lime');

    receta('Cheese Cake DDL', 'tortas', 1, [
      [chocolinas,  250],
      [manteca,     100],
      [leche,        50],
      [finlandia,   580],
      [ddl,         650],   // 500 + 150 cobertura
      [crema,       360],
      [azucar,      160],
      [huevos,        6],
      [pkgTorta,      1],
    ], 'Cheese Cake DDL');

    receta('Letter / Number Cake', 'tortas', 1, [
      [baseBrownie, 1],
      [ddl,      1000],
      [huevos,      4],
      [pkgLetra,    1],
    ], 'Number Cake');

    receta('Marquise con Frutos Rojos', 'tortas', 1, [
      [baseBrownie, 1],
      [ddl,      1000],
      [crema,     360],
      [frutosRojos, 400],
      [pkgTorta,    1],
    ], 'Marquise');

    // ══════════════════════════════════════════════
    // MINIS / PARA EL TÉ
    // ══════════════════════════════════════════════

    receta('Rogelitos (docena)', 'minis', 12, [
      [harina,    150],
      [sal,         1],
      [yemas,       1],
      [manteca,    35],
      [ddl,       120],
      [claras,      2],
      [azucar,    120],
      [pkgMicros,   1],
    ]);

    receta('Brownies (20u)', 'minis', 20, [
      [huevos,    4],
      [harina,  200],
      [manteca, 150],
      [chocolate, 150],
      [azucar,  400],
      [pkgMicros, 1],
    ], 'Brownies');

    receta('Bombitas (20u)', 'minis', 20, [
      [baseBrownie, 1],
      [ddl,       300],
      [azucar,    200],
      [claras,      1],
      [pkgMicros,   1],
    ]);

    receta('Mini Lemons (12u)', 'minis', 12, [
      [harina,   250],
      [manteca,  310],  // 110 masa + 200 relleno
      [azucar,   380],  // 120 + 200 + 60 merengue
      [huevos,     2],
      [yemas,      5],
      [limas,      2],
      [claras,     2],
      [pkgMicros,  1],
    ]);

    receta('Alfajorcitos de Manteca (20u)', 'minis', 20, [
      [harina,   250],
      [manteca,  110],
      [azucar,   120],
      [huevos,     1],
      [ddl,      400],
      [pkgMicros,  1],
    ], 'Alfajores de Manteca');

    receta('Mini Crumble (12u)', 'minis', 12, [
      [harina,   340],  // 250 masa + 90 crumble
      [manteca,  200],  // 110 + 90
      [azucar,   210],  // 120 + 90
      [huevos,     1],
      [manzanas, 1500],
      [pkgMicros,  1],
    ]);

    receta('Masitas de Coco (20u)', 'minis', 20, [
      [harina,   250],
      [azucar,   250],   // 50 masa + 200 merengue
      [manteca,  200],
      [yemas,      3],
      [ddl,      500],
      [coco,     150],
      [pkgMicros,  1],
    ], 'Masitas');

    receta('Alfajores de Nuez (20u)', 'minis', 20, [
      [harina,   300],
      [nueces,   200],
      [azucar,    70],
      [manteca,  200],
      [huevos,     1],
      [ddl,      100],   // ~5g por alfajor × 20
      [pkgMicros,  1],
    ], 'Alfajores de Nuez');

    receta('Alfajores de Almendras (20u)', 'minis', 20, [
      [harina,   300],
      [almendras, 200],
      [azucar,    70],
      [manteca,  200],
      [huevos,     1],
      [ddl,      100],
      [pkgMicros,  1],
    ], 'Alfajores de Almendra');

    receta('Alfajores de Maicena (20u)', 'minis', 20, [
      [manteca,    150],
      [azucarImp,  150],
      [yemas,        9],
      [maicena,    400],
      [harina,     100],
      [polvoHornear, 10],
      [ddl,        100],
      [pkgMicros,    1],
    ], 'Alfajores de Maizena');

    // ══════════════════════════════════════════════
    // BUDINES (sin packaging por ahora)
    // ══════════════════════════════════════════════

    receta('Budín de Limón', 'budines', 1, [
      [manteca,    100],
      [azucar,     200],
      [huevos,       2],
      [harinaLeu,  240],
      [leche,      300],
      [limas,        1],
      [azucarImp,  300],
    ], 'Budín de Limón');

    // Marcar como seeded
    db.prepare("INSERT INTO config (clave, valor) VALUES ('recetas_seeded_v1', '1')").run();
    db.exec('COMMIT');
    console.log('✅ Recetas seeded (v1): 30 recetas cargadas');
  } catch (e) {
    db.exec('ROLLBACK');
    console.error('❌ Error seeding recetas:', e.message);
  }
}
