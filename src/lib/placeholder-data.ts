import type { Supplier, SupplierProduct } from '@/types';

export const suppliers: Supplier[] = [
    {
        id: "agrofresh-farms",
        organizationId: "org-1",
        name: "AgroFresh Farms",
        category: "Frutas y Verduras",
        email: "pedidos@agrofresh.com",
        address: "123 Farming Ln, Homestead, FL 33034",
        contacts: [
            { id: "1", department: "Ventas", name: "Mario Rossi", phone: "(305) 999-8888", isWhatsapp: true },
            { id: "2", department: "Contabilidad", name: "Luigi Verdi", phone: "(305) 999-8889", isWhatsapp: false },
        ],
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
        organizationId: "org-1",
        name: "PackPro Solutions",
        category: "Empaques y Desechables",
        email: "sales@packpro.com",
        address: "456 Industrial Pkwy, Doral, FL 33178",
        contacts: [
            { id: "3", department: "Ventas", name: "Linda Smith", phone: "(305) 123-4567", isWhatsapp: false },
        ],
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
        organizationId: "org-1",
        name: "Dairy Kings",
        category: "Lácteos y Huevos",
        email: "orders@dairykings.com",
        address: "789 Dairy Rd, Okeechobee, FL 34972",
        contacts: [
            { id: "4", department: "Ventas", name: "Roberto Diaz", phone: "(786) 555-0199", isWhatsapp: true },
        ],
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
        organizationId: "org-1",
        name: "Importadora Global",
        category: "Secos y Abarrotes",
        email: "import@global.com",
        address: "901 Port Blvd, Miami, FL 33132",
        contacts: [
            { id: "5", department: "Ventas", name: "Chen Wei", phone: "(305) 777-1234", isWhatsapp: false },
        ],
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
