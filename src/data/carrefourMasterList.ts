import { ShoppingList, ShoppingListItem, GroceryCategory } from '../types';

export interface MasterItemDef {
  product: string;
  category: GroceryCategory;
  categoryGroup: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
}

export const CARREFOUR_MASTER_ITEMS_DATA: MasterItemDef[] = [
  // PROTEINAS
  { product: 'Frango', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 2, unit: 'kg', estimatedPrice: 39.80 },
  { product: 'Calabresa', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 24.50 },
  { product: 'Carne bovina', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 38.90 },
  { product: 'Carne moida', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 32.90 },
  { product: 'Ovo de codorna', category: 'Alimentos', categoryGroup: 'Proteínas', quantity: 1, unit: 'cartela', estimatedPrice: 9.90 },
  { product: 'Ovos', category: 'Alimentos', categoryGroup: 'Proteínas', quantity: 1, unit: 'cartela (30un)', estimatedPrice: 22.90 },
  { product: 'Peixe - 2', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 34.90 },
  { product: 'Peixe - 1', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 29.90 },
  { product: 'Bacon', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 28.90 },
  { product: 'Atum solido', category: 'Alimentos', categoryGroup: 'Proteínas', quantity: 2, unit: 'lata', estimatedPrice: 17.00 },
  { product: 'Porco', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 22.90 },
  { product: 'Linguica', category: 'Carnes e frango', categoryGroup: 'Proteínas', quantity: 1, unit: 'kg', estimatedPrice: 21.90 },

  // BASICOS
  { product: 'Arroz', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'pac (5kg)', estimatedPrice: 28.90 },
  { product: 'Feijao', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'kg', estimatedPrice: 15.80 },
  { product: 'Macarrao', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'pac (500g)', estimatedPrice: 8.40 },
  { product: 'Miojo', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 4, unit: 'un', estimatedPrice: 8.80 },
  { product: 'Oleo', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'un (900ml)', estimatedPrice: 13.00 },
  { product: 'Azeite', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'vd (500ml)', estimatedPrice: 36.90 },
  { product: 'Acucar', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'kg', estimatedPrice: 8.40 },
  { product: 'Sal', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'kg', estimatedPrice: 2.50 },
  { product: 'Farinha', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'kg', estimatedPrice: 4.50 },
  { product: 'Cafe', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'pac (500g)', estimatedPrice: 37.00 },
  { product: 'Milho lata', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 2, unit: 'lata', estimatedPrice: 7.00 },
  { product: 'Farinha Trigo', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'kg', estimatedPrice: 4.80 },
  { product: 'Cuscuz', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'pac (500g)', estimatedPrice: 3.20 },
  { product: 'Massa de bolo', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'cx', estimatedPrice: 5.90 },
  { product: 'Coco ralado', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'pac (100g)', estimatedPrice: 4.50 },
  { product: 'Mel', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'frasco', estimatedPrice: 16.90 },
  { product: 'Fuba', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 1, unit: 'kg', estimatedPrice: 3.90 },
  { product: 'Molho de tomate', category: 'Alimentos', categoryGroup: 'Básicos', quantity: 3, unit: 'sachê', estimatedPrice: 7.20 },

  // HORTIFRUTI
  { product: 'Alface', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'un', estimatedPrice: 3.90 },
  { product: 'Cogumelos', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'band', estimatedPrice: 9.90 },
  { product: 'Tomate', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 8.90 },
  { product: 'Couve', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'maço', estimatedPrice: 3.50 },
  { product: 'Pimenta', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'un', estimatedPrice: 2.90 },
  { product: 'Rucula', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'maço', estimatedPrice: 4.20 },
  { product: 'Repolho', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'un', estimatedPrice: 4.90 },
  { product: 'Berinjela', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 5.90 },
  { product: 'Pimentao', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 7.90 },
  { product: 'Beterraba', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 4.90 },
  { product: 'Abobora', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 4.50 },
  { product: 'Chuchu', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 3.90 },
  { product: 'Cebola', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 5.90 },
  { product: 'Alho', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'cartela', estimatedPrice: 6.90 },
  { product: 'Batata', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 2, unit: 'kg', estimatedPrice: 13.00 },
  { product: 'Cenoura', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 5.20 },
  { product: 'Abobrinha', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 4.90 },
  { product: 'Banana', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 6.90 },
  { product: 'Maca', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 8.90 },
  { product: 'Limao', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 4.90 },
  { product: 'Mamao', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'un', estimatedPrice: 6.50 },
  { product: 'Cheiro Verde', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'maço', estimatedPrice: 2.50 },
  { product: 'Melao', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'un', estimatedPrice: 9.90 },
  { product: 'Manga', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 7.90 },
  { product: 'Mexerica', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 1, unit: 'kg', estimatedPrice: 6.90 },
  { product: 'Laranja', category: 'Frutas, verduras e legumes', categoryGroup: 'Hortifruti', quantity: 2, unit: 'kg', estimatedPrice: 11.00 },

  // LATICINIOS E FRIOS
  { product: 'Leite', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 6, unit: 'L', estimatedPrice: 29.40 },
  { product: 'Leite de coco', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'vd (200ml)', estimatedPrice: 4.50 },
  { product: 'Queijo', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'band', estimatedPrice: 16.90 },
  { product: 'Presunto', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'band', estimatedPrice: 9.90 },
  { product: 'Iogurte', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'pack', estimatedPrice: 8.90 },
  { product: 'Yakult 40', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'pack (6un)', estimatedPrice: 13.90 },
  { product: 'Yakult', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'pack (6un)', estimatedPrice: 11.90 },
  { product: 'Requeijao', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'copo (200g)', estimatedPrice: 8.50 },
  { product: 'Leite condensado', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 2, unit: 'cx', estimatedPrice: 11.80 },
  { product: 'Creme de leite', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 2, unit: 'cx', estimatedPrice: 7.60 },
  { product: 'Manteiga', category: 'Frios e laticínios', categoryGroup: 'Laticínios e Frios', quantity: 1, unit: 'pote (200g)', estimatedPrice: 11.90 },

  // PADARIA
  { product: 'Pao frances', category: 'Produtos de padaria', categoryGroup: 'Padaria', quantity: 1, unit: 'kg', estimatedPrice: 8.90 },
  { product: 'Pao de forma', category: 'Produtos de padaria', categoryGroup: 'Padaria', quantity: 1, unit: 'pac', estimatedPrice: 7.50 },
  { product: 'Bisnaguinha', category: 'Produtos de padaria', categoryGroup: 'Padaria', quantity: 1, unit: 'pac', estimatedPrice: 6.90 },
  { product: 'Torrada', category: 'Produtos de padaria', categoryGroup: 'Padaria', quantity: 1, unit: 'pac', estimatedPrice: 5.50 },

  // TEMPEROS
  { product: 'Caldo de carne/frango', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'cx', estimatedPrice: 3.90 },
  { product: 'Sazon', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'cx', estimatedPrice: 4.50 },
  { product: 'Oregano', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 3.50 },
  { product: 'Paprica', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 4.20 },
  { product: 'Coloral', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 3.20 },
  { product: 'Tempero Baiano', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 3.80 },
  { product: 'Pimenta do reino', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 4.90 },
  { product: 'Curry', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'sachê', estimatedPrice: 4.50 },
  { product: 'Pimenta', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'vd', estimatedPrice: 6.90 },
  { product: 'Vinagre', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 3.90 },
  { product: 'Shoyo', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 6.90 },
  { product: 'Tare', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 12.90 },
  { product: 'Molho de salada', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 7.90 },
  { product: 'Ketchup', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 7.50 },
  { product: 'Mostarda', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'frasco', estimatedPrice: 6.50 },
  { product: 'Maionese', category: 'Alimentos', categoryGroup: 'Temperos', quantity: 1, unit: 'pote', estimatedPrice: 7.90 },

  // LIMPEZA
  { product: 'Detergente', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 3, unit: 'un (500ml)', estimatedPrice: 8.37 },
  { product: 'Esponja', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'pac (4un)', estimatedPrice: 5.50 },
  { product: 'Sabao roupa', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'cx/galão', estimatedPrice: 26.90 },
  { product: 'Amaciante', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'frasco (2L)', estimatedPrice: 16.90 },
  { product: 'Agua sanitaria', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'frasco (2L)', estimatedPrice: 6.90 },
  { product: 'Veneno', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'spray', estimatedPrice: 14.90 },
  { product: 'Antimofo', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 2, unit: 'pote', estimatedPrice: 17.80 },
  { product: 'Cheirinho', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'un', estimatedPrice: 9.90 },
  { product: 'Desinfetante', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'frasco (2L)', estimatedPrice: 12.50 },
  { product: 'Papel toalha', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'pac (2un)', estimatedPrice: 5.90 },
  { product: 'Saco de lixo', category: 'Produtos de limpeza', categoryGroup: 'Limpeza', quantity: 1, unit: 'pac', estimatedPrice: 11.90 },

  // HIGIENE PESSOAL
  { product: 'Shampoo Ellen', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco', estimatedPrice: 24.90 },
  { product: 'Shampoo Ric', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco', estimatedPrice: 19.90 },
  { product: 'Condicionador', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco', estimatedPrice: 22.90 },
  { product: 'Creme', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco', estimatedPrice: 18.90 },
  { product: 'Sabonete Liquido', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco', estimatedPrice: 12.90 },
  { product: 'Sabonete', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 4, unit: 'un', estimatedPrice: 12.80 },
  { product: 'Pasta de dente', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 2, unit: 'un', estimatedPrice: 11.80 },
  { product: 'Enxaguante bocal', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'frasco (500ml)', estimatedPrice: 19.90 },
  { product: 'Fio dental', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'un', estimatedPrice: 9.90 },
  { product: 'Escova de dente', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'pack (2un)', estimatedPrice: 14.90 },
  { product: 'Papel higienico', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'pac (24 rolos)', estimatedPrice: 32.90 },
  { product: 'ABS', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 2, unit: 'pac', estimatedPrice: 17.80 },
  { product: 'Gillette', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'pack', estimatedPrice: 18.90 },
  { product: 'Cotonete', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'cx', estimatedPrice: 4.90 },
  { product: 'Algodao', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'pac', estimatedPrice: 5.50 },
  { product: 'Lenco umedecido', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 1, unit: 'pac', estimatedPrice: 9.90 },
  { product: 'Desodorante', category: 'Produtos de higiene', categoryGroup: 'Higiene', quantity: 2, unit: 'aerosol', estimatedPrice: 29.80 },

  // GATOS
  { product: 'Racao gato', category: 'Produtos para o pet', categoryGroup: 'Gatos / Pet', quantity: 1, unit: 'pac (10kg)', estimatedPrice: 89.90 },
  { product: 'Areia gato', category: 'Produtos para o pet', categoryGroup: 'Gatos / Pet', quantity: 2, unit: 'pac (4kg)', estimatedPrice: 33.80 },
  { product: 'Sache gato', category: 'Produtos para o pet', categoryGroup: 'Gatos / Pet', quantity: 6, unit: 'sachê (85g)', estimatedPrice: 19.20 },
  { product: 'Petisco gato', category: 'Produtos para o pet', categoryGroup: 'Gatos / Pet', quantity: 2, unit: 'pac', estimatedPrice: 15.80 },

  // EXTRAS
  { product: 'Biscoito', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 2, unit: 'pac', estimatedPrice: 9.80 },
  { product: 'Salgadinho', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'pac', estimatedPrice: 6.90 },
  { product: 'Chocolate Po', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'lata (400g)', estimatedPrice: 9.90 },
  { product: 'Batata palha', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'pac (140g)', estimatedPrice: 6.50 },
  { product: 'Chocolate', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 2, unit: 'barra', estimatedPrice: 13.80 },
  { product: 'Refrigerante', category: 'Bebidas', categoryGroup: 'Extras e Bebidas', quantity: 2, unit: 'garrafa (2L)', estimatedPrice: 17.80 },
  { product: 'Suco / cha garrafa', category: 'Bebidas', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'garrafa', estimatedPrice: 7.90 },
  { product: 'Papel aluminio', category: 'Produtos de limpeza', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'rolo', estimatedPrice: 6.90 },
  { product: 'Cerveja', category: 'Bebidas', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'pack', estimatedPrice: 24.90 },
  { product: 'Utensilio / planta', category: 'Itens para a casa', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'un', estimatedPrice: 19.90 },
  { product: 'Cha', category: 'Bebidas', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'cx', estimatedPrice: 5.90 },
  { product: 'Capsulas Dolce Gusto', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'cx', estimatedPrice: 24.90 },
  { product: 'Pipoca', category: 'Alimentos', categoryGroup: 'Extras e Bebidas', quantity: 1, unit: 'pac', estimatedPrice: 4.50 },

  // JARDIM E CASA
  { product: 'Argila', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'pac', estimatedPrice: 12.90 },
  { product: 'Vaso', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'un', estimatedPrice: 18.90 },
  { product: 'Substrato', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'pac (5kg)', estimatedPrice: 14.90 },
  { product: 'Humus', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'pac (2kg)', estimatedPrice: 8.90 },
  { product: 'Pulverizador', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'un', estimatedPrice: 15.90 },
  { product: 'Estante', category: 'Itens para a casa', categoryGroup: 'Jardim e Casa', quantity: 1, unit: 'un', estimatedPrice: 89.90 },
];

/**
 * Creates the master Carrefour default shopping list
 */
export function createCarrefourMasterShoppingList(
  customName = 'LISTA DE COMPRAS - CARREFOUR',
  preferredStore = 'Carrefour',
  monthKey = '2026-08'
): ShoppingList {
  const items: ShoppingListItem[] = CARREFOUR_MASTER_ITEMS_DATA.map((def, idx) => ({
    id: `sli-master-${Date.now()}-${idx}`,
    product: def.product,
    quantity: def.quantity,
    unit: def.unit,
    category: def.category,
    categoryGroup: def.categoryGroup,
    priority: 'Média',
    preferredStore: preferredStore,
    lastPricePaid: def.estimatedPrice,
    lowestHistoricalPrice: def.estimatedPrice * 0.92,
    estimatedPrice: def.estimatedPrice,
    actualPrice: def.estimatedPrice,
    completed: false,
    notes: `Item padrão da lista master (${def.categoryGroup})`,
  }));

  const estimatedTotal = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

  return {
    id: 'list-carrefour-master',
    name: customName,
    type: 'personalizada',
    monthKey,
    createdAt: new Date().toISOString().slice(0, 10),
    estimatedTotal,
    items,
    isDemo: true,
  };
}
