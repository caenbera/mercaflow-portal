import type { Supplier, SupplierProduct } from '@/types';

export const suppliers: Supplier[] = [
    {
        id: "agrofresh-farms",
        name: "AgroFresh Farms",
        category: "Frutas y Verduras",
        logo: "https://ui-avatars.com/api/?name=Agro+Fresh&background=27ae60&color=fff",
        contact: {
            name: "Mario Rossi",
            phone: "(305) 999-8888",
            email: "pedidos@agrofresh.com"
        },
        rating: 5,
        deliveryDays: "Lun, Mie, Vie",
        paymentTerms: "Net 15",
        status: 'active',
        verified: true,
        notes: "Proveedor principal de tomates. Precios suelen subir en invierno. Contactar para negociar volumen anual.",
        finance: {
            pendingBalance: 4500.00,
            ytdSpend: 24000,
            fillRate: 98,
            onTimeDelivery: true,
        }
    },
    {
        id: "packpro-solutions",
        name: "PackPro Solutions",
        category: "Empaques y Desechables",
        logo: "https://ui-avatars.com/api/?name=Pack+Pro&background=2980b9&color=fff",
        contact: {
            name: "Linda Smith",
            phone: "(305) 123-4567",
            email: "sales@packpro.com",
        },
        rating: 4,
        deliveryDays: "Jueves",
        paymentTerms: "Net 30",
        status: 'active',
        verified: false,
        finance: {
            pendingBalance: 1200.50,
            ytdSpend: 8500,
            fillRate: 99,
            onTimeDelivery: true,
        }
    },
    {
        id: "dairy-kings",
        name: "Dairy Kings",
        category: "Lácteos y Huevos",
        logo: "https://ui-avatars.com/api/?name=Dairy+Kings&background=f1c40f&color=fff",
        contact: {
            name: "Roberto Diaz",
            phone: "(786) 555-0199",
            email: "orders@dairykings.com",
        },
        rating: 3,
        deliveryDays: "Diario",
        paymentTerms: "Net 7",
        status: 'active',
        verified: true,
        finance: {
            pendingBalance: 0.00,
            ytdSpend: 15000,
            fillRate: 95,
            onTimeDelivery: false,
        }
    },
    {
        id: "importadora-global",
        name: "Importadora Global",
        category: "Secos y Abarrotes",
        logo: "https://ui-avatars.com/api/?name=Global+Imp&background=8e44ad&color=fff",
        contact: {
            name: "Chen Wei",
            phone: "(305) 777-1234",
            email: "import@global.com",
        },
        rating: 5,
        deliveryDays: "Martes",
        paymentTerms: "COD",
        status: 'inactive',
        verified: true,
        finance: {
            pendingBalance: 6750.00,
            ytdSpend: 32000,
            fillRate: 100,
            onTimeDelivery: true,
        }
    }
];

export const supplierProducts: SupplierProduct[] = [
    {
        id: '1',
        sku: "AG-001",
        name: "Tomate Chonto Primera",
        imageUrl: "https://i.postimg.cc/TY6YMwmY/tomate_chonto.png",
        purchaseUnit: "Caja 20lb",
        currentCost: 12.50,
        previousCost: 12.00,
        stockStatus: 'available',
    },
    {
        id: '2',
        sku: "AG-005",
        name: "Cebolla Blanca",
        imageUrl: "https://i.postimg.cc/TPwHKV88/cebolla_blanca.png",
        purchaseUnit: "Bulto 50lb",
        currentCost: 28.00,
        previousCost: 30.00,
        stockStatus: 'available',
    },
    {
        id: '3',
        sku: "AG-012",
        name: "Chile Manzano",
        imageUrl: "https://i.postimg.cc/8PSPQ5vb/chile_manzano.png",
        purchaseUnit: "Caja 10lb",
        currentCost: 45.00,
        previousCost: null,
        stockStatus: 'limited',
    }
];
