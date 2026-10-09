import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const branches = ref([
    { id: 'b-commissary', name: 'Main Commissary / Central Hub' },
    { id: 'b-downtown', name: 'Downtown Branch' },
    { id: 'b-uptown', name: 'Uptown Branch' },
  ])

  // MASTER PARENT-VARIANT HIERARCHY (Expanded Catalog)
  const catalog = ref([
    {
      parentId: 'P-100',
      parentName: 'Concentrated Fruit Tea Syrup',
      category: 'Syrups',
      subCategory: 'Fruit Flavors',
      brand: 'Sunwide',
      supplier: 'Golden Dragon Import Corp',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-1001',
          sku: 'SYR-SUN-APL-2.5L',
          flavor: 'Green Apple',
          color: 'Emerald Green',
          subtitle: 'Premium Barista Blend',
          supplierItemNo: 'SW-APL-882',
          sizeCapacity: '2.5L',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 35, widthCm: 25, heightCm: 30, weightKg: 16.5 },
          uom: {
            level1: { unit: 'bottle', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 6 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: true, label: 'Pair Lot', qtyOfLvl1: 2 },
          },
          baseCost: 380.0,
        },
        {
          id: 'V-1002',
          sku: 'SYR-SUN-LYC-2.5L',
          flavor: 'Lychee',
          color: 'Translucent White',
          subtitle: 'Sweet Floral Extract',
          supplierItemNo: 'SW-LYC-104',
          sizeCapacity: '2.5L',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 35, widthCm: 25, heightCm: 30, weightKg: 16.5 },
          uom: {
            level1: { unit: 'bottle', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 6 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: false },
          },
          baseCost: 380.0,
        },
      ],
    },
    {
      parentId: 'P-200',
      parentName: 'U-Cup Injection Molded Plastic',
      category: 'Packaging',
      subCategory: 'Plastic Cups',
      brand: 'EcoPack',
      supplier: 'Manila Plastics Industrial',
      isPerishable: false,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-2001',
          sku: 'CUP-EP-90-16OZ',
          flavor: null,
          color: 'Ultra Clear',
          subtitle: '90mm Caliber Flat Rim',
          supplierItemNo: 'EP-90-16',
          sizeCapacity: '16oz (500ml)',
          shelfLifeDays: null,
          dimensions: { lengthCm: 45, widthCm: 38, heightCm: 42, weightKg: 12.0 },
          uom: {
            level1: { unit: 'sleeve', pcsPerUnit: 50 },
            level2: { unit: 'master carton', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 24 },
            bundle: { enabled: true, label: 'Promo Twin-Sleeve', qtyOfLvl1: 2 },
          },
          baseCost: 110.0,
        },
        {
          id: 'V-2002',
          sku: 'CUP-EP-90-22OZ',
          flavor: null,
          color: 'Ultra Clear',
          subtitle: '90mm Caliber Tall Rim',
          supplierItemNo: 'EP-90-22',
          sizeCapacity: '22oz (700ml)',
          shelfLifeDays: null,
          dimensions: { lengthCm: 48, widthCm: 40, heightCm: 46, weightKg: 14.2 },
          uom: {
            level1: { unit: 'sleeve', pcsPerUnit: 50 },
            level2: { unit: 'master carton', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 135.0,
        },
      ],
    },
    {
      parentId: 'P-300',
      parentName: 'Automatic Cup Sealing Machine',
      category: 'Machines/Hardware',
      subCategory: 'Sealing Equipment',
      brand: 'Fest Tech',
      supplier: 'Kevins Kitchen Equipment',
      isPerishable: false,
      itemType: 'hardware',
      variants: [
        {
          id: 'V-3001',
          sku: 'MAC-FEST-RC95',
          flavor: null,
          color: 'Matte Black',
          subtitle: 'Microcomputer Dual Sensor',
          supplierItemNo: 'FEST-RC95',
          sizeCapacity: '400 cups/hr',
          warranty: '1 Year Full Parts & Labor',
          machineSpecs: '220V / 350W / 90-95mm caliber universal ring',
          dimensions: { lengthCm: 36, widthCm: 25, heightCm: 58, weightKg: 28.5 },
          uom: {
            level1: { unit: 'unit', pcsPerUnit: 1 },
            level2: { unit: 'wooden crate', multiplier: 1 },
            level3: { unit: 'pallet', multiplier: 8 },
            bundle: { enabled: false },
          },
          baseCost: 14500.0,
        },
      ],
    },
    {
      parentId: 'P-400',
      parentName: 'Black Tapioca Boba Pearls',
      category: 'Toppings',
      subCategory: 'Boba Pearls',
      brand: 'Andes Chewy',
      supplier: 'Taiwan Agro-Food Imports',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-4001',
          sku: 'BOB-AND-BLK-3KG',
          flavor: 'Brown Sugar Aroma',
          color: 'Jet Black',
          subtitle: 'Grade A Vacuum Pack 2.3mm',
          supplierItemNo: 'AND-BBA-3K',
          sizeCapacity: '3.0kg Vacuum Bag',
          shelfLifeDays: 240,
          dimensions: { lengthCm: 42, widthCm: 30, heightCm: 22, weightKg: 18.5 },
          uom: {
            level1: { unit: 'bag', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 6 },
            level3: { unit: 'pallet', multiplier: 30 },
            bundle: { enabled: true, label: 'Double Bag Bundle', qtyOfLvl1: 2 },
          },
          baseCost: 320.0,
        },
        {
          id: 'V-4002',
          sku: 'BOB-AND-MINI-1KG',
          flavor: 'Honey Glaze',
          color: 'Amber Gold',
          subtitle: 'Mini 1.8mm Quick Cook',
          supplierItemNo: 'AND-MNI-1K',
          sizeCapacity: '1.0kg Bag',
          shelfLifeDays: 240,
          dimensions: { lengthCm: 38, widthCm: 28, heightCm: 20, weightKg: 12.0 },
          uom: {
            level1: { unit: 'bag', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 12 },
            level3: { unit: 'pallet', multiplier: 32 },
            bundle: { enabled: false },
          },
          baseCost: 140.0,
        },
      ],
    },
    {
      parentId: 'P-500',
      parentName: 'Commercial Loose Leaf Tea',
      category: 'Tea Bases',
      subCategory: 'Whole Leaves',
      brand: 'Chun Cui',
      supplier: 'Highland Leaf Trading',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-5001',
          sku: 'TEA-CHU-ASM-600G',
          flavor: 'Assam Black Tea',
          color: 'Deep Amber',
          subtitle: 'Bold Malt Brew for Milk Tea',
          supplierItemNo: 'CHU-ASM-60',
          sizeCapacity: '600g Foil Pouch',
          shelfLifeDays: 730,
          dimensions: { lengthCm: 45, widthCm: 32, heightCm: 28, weightKg: 15.0 },
          uom: {
            level1: { unit: 'pouch', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 24 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 260.0,
        },
        {
          id: 'V-5002',
          sku: 'TEA-CHU-JAS-600G',
          flavor: 'Jasmine Green Tea',
          color: 'Pale Jade',
          subtitle: 'Quadruple Scented Blossom',
          supplierItemNo: 'CHU-JAS-60',
          sizeCapacity: '600g Foil Pouch',
          shelfLifeDays: 730,
          dimensions: { lengthCm: 45, widthCm: 32, heightCm: 28, weightKg: 15.0 },
          uom: {
            level1: { unit: 'pouch', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 24 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 290.0,
        },
        {
          id: 'V-5003',
          sku: 'TEA-CHU-OOL-600G',
          flavor: 'Roasted Oolong Tea',
          color: 'Smoky Copper',
          subtitle: 'Heavy Charcoal Roast',
          supplierItemNo: 'CHU-OOL-60',
          sizeCapacity: '600g Foil Pouch',
          shelfLifeDays: 730,
          dimensions: { lengthCm: 45, widthCm: 32, heightCm: 28, weightKg: 15.0 },
          uom: {
            level1: { unit: 'pouch', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 24 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 310.0,
        },
      ],
    },
    {
      parentId: 'P-600',
      parentName: 'Flavored Milk Tea Powder',
      category: 'Powders',
      subCategory: 'Flavored Bases',
      brand: 'Boba King',
      supplier: 'Golden Dragon Import Corp',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-6001',
          sku: 'POW-BBK-TAR-1KG',
          flavor: 'Taro Premium',
          color: 'Lilac Violet',
          subtitle: 'Velvety Creaminess Formula',
          supplierItemNo: 'BK-TAR-10',
          sizeCapacity: '1.0kg Pouch',
          shelfLifeDays: 540,
          dimensions: { lengthCm: 40, widthCm: 28, heightCm: 30, weightKg: 21.0 },
          uom: {
            level1: { unit: 'bag', pcsPerUnit: 1 },
            level2: { unit: 'case', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: true, label: '3-Bag Value Trio', qtyOfLvl1: 3 },
          },
          baseCost: 240.0,
        },
        {
          id: 'V-6002',
          sku: 'POW-BBK-OKI-1KG',
          flavor: 'Okinawa Brown Sugar',
          color: 'Toasted Caramel',
          subtitle: 'Kokuto Molasses Blend',
          supplierItemNo: 'BK-OKI-10',
          sizeCapacity: '1.0kg Pouch',
          shelfLifeDays: 540,
          dimensions: { lengthCm: 40, widthCm: 28, heightCm: 30, weightKg: 21.0 },
          uom: {
            level1: { unit: 'bag', pcsPerUnit: 1 },
            level2: { unit: 'case', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: false },
          },
          baseCost: 255.0,
        },
        {
          id: 'V-6003',
          sku: 'POW-BBK-MAT-1KG',
          flavor: 'Kyoto Ceremonial Matcha',
          color: 'Vibrant Forest Green',
          subtitle: 'Shade-Grown Micro Powder',
          supplierItemNo: 'BK-MAT-10',
          sizeCapacity: '1.0kg Pouch',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 40, widthCm: 28, heightCm: 30, weightKg: 21.0 },
          uom: {
            level1: { unit: 'bag', pcsPerUnit: 1 },
            level2: { unit: 'case', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: false },
          },
          baseCost: 390.0,
        },
      ],
    },
    {
      parentId: 'P-700',
      parentName: 'Real Fruit Popping Boba',
      category: 'Toppings',
      subCategory: 'Popping Pearls',
      brand: 'JuiceBurst',
      supplier: 'Oceanic Food Logistics',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-7001',
          sku: 'POP-JCB-MGO-3.2KG',
          flavor: 'Alphonso Mango',
          color: 'Golden Orange',
          subtitle: '15% Real Fruit Nectar Inside',
          supplierItemNo: 'JB-MGO-32',
          sizeCapacity: '3.2kg Tub',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 38, widthCm: 38, heightCm: 24, weightKg: 14.0 },
          uom: {
            level1: { unit: 'tub', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 28 },
            bundle: { enabled: false },
          },
          baseCost: 460.0,
        },
        {
          id: 'V-7002',
          sku: 'POP-JCB-STR-3.2KG',
          flavor: 'Wild Strawberry',
          color: 'Ruby Crimson',
          subtitle: 'Thin Alginate Seamless Shell',
          supplierItemNo: 'JB-STR-32',
          sizeCapacity: '3.2kg Tub',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 38, widthCm: 38, heightCm: 24, weightKg: 14.0 },
          uom: {
            level1: { unit: 'tub', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 28 },
            bundle: { enabled: false },
          },
          baseCost: 460.0,
        },
      ],
    },
    {
      parentId: 'P-800',
      parentName: 'Nata De Coco Jelly Strips',
      category: 'Toppings',
      subCategory: 'Coconut Jelly',
      brand: 'Sunwide',
      supplier: 'Golden Dragon Import Corp',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-8001',
          sku: 'NAT-SUN-ORI-3.8KG',
          flavor: 'Original Coconut',
          color: 'Translucent White',
          subtitle: 'Crisp Sweet Syrup Preserved',
          supplierItemNo: 'SW-NAT-38',
          sizeCapacity: '3.8kg Jar',
          shelfLifeDays: 540,
          dimensions: { lengthCm: 42, widthCm: 42, heightCm: 26, weightKg: 16.5 },
          uom: {
            level1: { unit: 'jar', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 24 },
            bundle: { enabled: false },
          },
          baseCost: 350.0,
        },
        {
          id: 'V-8002',
          sku: 'NAT-SUN-RNB-3.8KG',
          flavor: 'Rainbow Mixed Fruit',
          color: 'Multi-Color Swirl',
          subtitle: 'Tri-Flavored Strip Medley',
          supplierItemNo: 'SW-RNB-38',
          sizeCapacity: '3.8kg Jar',
          shelfLifeDays: 540,
          dimensions: { lengthCm: 42, widthCm: 42, heightCm: 26, weightKg: 16.5 },
          uom: {
            level1: { unit: 'jar', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 24 },
            bundle: { enabled: false },
          },
          baseCost: 375.0,
        },
      ],
    },
    {
      parentId: 'P-900',
      parentName: 'Cream Cheese Foam Whipping Powder',
      category: 'Powders',
      subCategory: 'Specialty Foams',
      brand: 'CheesyTop',
      supplier: 'Taiwan Agro-Food Imports',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-9001',
          sku: 'CFM-CHT-SLT-1KG',
          flavor: 'Himalayan Salted Cheese',
          color: 'Ivory Cream',
          subtitle: 'Firm Dense Stiff Peak Whip',
          supplierItemNo: 'CT-SLT-10',
          sizeCapacity: '1.0kg Pouch',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 38, widthCm: 26, heightCm: 32, weightKg: 11.0 },
          uom: {
            level1: { unit: 'pouch', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 10 },
            level3: { unit: 'pallet', multiplier: 30 },
            bundle: { enabled: true, label: 'Dual Pack', qtyOfLvl1: 2 },
          },
          baseCost: 310.0,
        },
      ],
    },
    {
      parentId: 'P-1000',
      parentName: 'Pointed Boba Straws',
      category: 'Packaging',
      subCategory: 'Straws',
      brand: 'EcoPack',
      supplier: 'Manila Plastics Industrial',
      isPerishable: false,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-10010',
          sku: 'STR-EP-12MM-PPR',
          flavor: null,
          color: 'Kraft Brown',
          subtitle: '12mm Paper Wrapped Disposable',
          supplierItemNo: 'EP-STR-12P',
          sizeCapacity: '210mm x 12mm',
          shelfLifeDays: null,
          dimensions: { lengthCm: 55, widthCm: 45, heightCm: 35, weightKg: 8.5 },
          uom: {
            level1: { unit: 'pack', pcsPerUnit: 100 },
            level2: { unit: 'carton', multiplier: 25 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 75.0,
        },
        {
          id: 'V-10020',
          sku: 'STR-EP-12MM-CLR',
          flavor: null,
          color: 'Frosted Clear',
          subtitle: '12mm Individually Poly-Film Wrapped',
          supplierItemNo: 'EP-STR-12C',
          sizeCapacity: '210mm x 12mm',
          shelfLifeDays: null,
          dimensions: { lengthCm: 55, widthCm: 45, heightCm: 35, weightKg: 7.8 },
          uom: {
            level1: { unit: 'pack', pcsPerUnit: 100 },
            level2: { unit: 'carton', multiplier: 25 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 65.0,
        },
      ],
    },
    {
      parentId: 'P-1100',
      parentName: 'Universal Cup Sealing Film Roll',
      category: 'Packaging',
      subCategory: 'Sealing Film',
      brand: 'SealPro',
      supplier: 'Manila Plastics Industrial',
      isPerishable: false,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-1101',
          sku: 'FLM-SLP-FRO-3000',
          flavor: null,
          color: 'Matte Frosted',
          subtitle: 'Easy-Peel High Elasticity PP/PET',
          supplierItemNo: 'SP-FLM-MAT',
          sizeCapacity: '3,000 Cups / Roll',
          shelfLifeDays: null,
          dimensions: { lengthCm: 38, widthCm: 25, heightCm: 28, weightKg: 14.5 },
          uom: {
            level1: { unit: 'roll', pcsPerUnit: 1 },
            level2: { unit: 'case', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 36 },
            bundle: { enabled: false },
          },
          baseCost: 890.0,
        },
        {
          id: 'V-1102',
          sku: 'FLM-SLP-CLR-3500',
          flavor: null,
          color: 'Ultra High Gloss Clear',
          subtitle: 'Optical Clarity Anti-Tear Formula',
          supplierItemNo: 'SP-FLM-CLR',
          sizeCapacity: '3,500 Cups / Roll',
          shelfLifeDays: null,
          dimensions: { lengthCm: 38, widthCm: 25, heightCm: 28, weightKg: 15.2 },
          uom: {
            level1: { unit: 'roll', pcsPerUnit: 1 },
            level2: { unit: 'case', multiplier: 4 },
            level3: { unit: 'pallet', multiplier: 36 },
            bundle: { enabled: false },
          },
          baseCost: 950.0,
        },
      ],
    },
    {
      parentId: 'P-1200',
      parentName: 'Commercial Heavy-Duty Blender',
      category: 'Machines/Hardware',
      subCategory: 'Blending Equipment',
      brand: 'OmniBlend',
      supplier: 'Kevins Kitchen Equipment',
      isPerishable: false,
      itemType: 'hardware',
      variants: [
        {
          id: 'V-1201',
          sku: 'MAC-OMN-SHIELD-2L',
          flavor: null,
          color: 'Space Grey & Acrylic',
          subtitle: 'Acoustic Sound Enclosure Shield',
          supplierItemNo: 'OMN-V8-2000',
          sizeCapacity: '2.0L Tritan Pitcher',
          warranty: '2 Years Motor & Electronics',
          machineSpecs: '220V / 1800W / 38,000 RPM / 6-Leaf Japanese Blade',
          dimensions: { lengthCm: 32, widthCm: 30, heightCm: 52, weightKg: 9.8 },
          uom: {
            level1: { unit: 'unit', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 1 },
            level3: { unit: 'pallet', multiplier: 18 },
            bundle: { enabled: false },
          },
          baseCost: 11200.0,
        },
      ],
    },
    {
      parentId: 'P-1300',
      parentName: 'Automatic Quantitative Fructose Dispenser',
      category: 'Machines/Hardware',
      subCategory: 'Dispensing Equipment',
      brand: 'Fest Tech',
      supplier: 'Kevins Kitchen Equipment',
      isPerishable: false,
      itemType: 'hardware',
      variants: [
        {
          id: 'V-1301',
          sku: 'MAC-FEST-FRUC-8.5L',
          flavor: null,
          color: 'Brushed Stainless Steel',
          subtitle: '24-Key Programmable Memory Matrix',
          supplierItemNo: 'FEST-FR85',
          sizeCapacity: '8.5L Tank Capacity',
          warranty: '1 Year Full Parts & Labor',
          machineSpecs: '220V / 280W / Constant Temp Thermostat Heating',
          dimensions: { lengthCm: 40, widthCm: 30, heightCm: 48, weightKg: 11.5 },
          uom: {
            level1: { unit: 'unit', pcsPerUnit: 1 },
            level2: { unit: 'carton', multiplier: 1 },
            level3: { unit: 'pallet', multiplier: 16 },
            bundle: { enabled: false },
          },
          baseCost: 7800.0,
        },
      ],
    },
  ])

  // Default Baseline Branch Stocks for Demo Reset
  const DEFAULT_BRANCH_STOCKS = {
    'b-commissary': {
      'V-1001': 240,
      'V-1002': 180,
      'V-2001': 350,
      'V-2002': 120,
      'V-3001': 8,
      'V-4001': 160,
      'V-4002': 90,
      'V-5001': 120,
      'V-5002': 110,
      'V-5003': 85,
      'V-6001': 140,
      'V-6002': 95,
      'V-6003': 60,
      'V-7001': 112,
      'V-7002': 96,
      'V-8001': 80,
      'V-8002': 75,
      'V-9001': 70,
      'V-10010': 300,
      'V-10020': 250,
      'V-1101': 48,
      'V-1102': 36,
      'V-1201': 12,
      'V-1301': 10,
    },
    'b-downtown': {
      'V-1001': 18,
      'V-1002': 6,
      'V-2001': 45,
      'V-2002': 15,
      'V-3001': 1,
      'V-4001': 12,
      'V-4002': 8,
      'V-5001': 14,
      'V-5002': 10,
      'V-5003': 6,
      'V-6001': 15,
      'V-6002': 8,
      'V-6003': 4,
      'V-7001': 8,
      'V-7002': 6,
      'V-8001': 8,
      'V-8002': 4,
      'V-9001': 5,
      'V-10010': 40,
      'V-10020': 30,
      'V-1101': 4,
      'V-1102': 2,
      'V-1201': 1,
      'V-1301': 1,
    },
    'b-uptown': {
      'V-1001': 6,
      'V-1002': 0,
      'V-2001': 20,
      'V-2002': 0,
      'V-3001': 0,
      'V-4001': 4,
      'V-4002': 0,
      'V-5001': 6,
      'V-5002': 4,
      'V-5003': 0,
      'V-6001': 5,
      'V-6002': 0,
      'V-6003': 0,
      'V-7001': 2,
      'V-7002': 0,
      'V-8001': 2,
      'V-8002': 0,
      'V-9001': 0,
      'V-10010': 15,
      'V-10020': 10,
      'V-1101': 1,
      'V-1102': 0,
      'V-1201': 0,
      'V-1301': 0,
    },
  }

  // Branch Stocks tied to All Variant IDs: { branchId: { variantId: baseUnitStock } }
  const savedStocks = localStorage.getItem('inventory_branch_stocks')
  const branchStocks = ref(
    savedStocks ? JSON.parse(savedStocks) : JSON.parse(JSON.stringify(DEFAULT_BRANCH_STOCKS)),
  )

  function saveBranchStocks() {
    localStorage.setItem('inventory_branch_stocks', JSON.stringify(branchStocks.value))
  }

  // Clean empty default for transfer requests (No pre-seeded mock records)
  const savedTransferRequests = localStorage.getItem('inventory_transfer_requests')
  const transferRequests = ref(savedTransferRequests ? JSON.parse(savedTransferRequests) : [])

  function saveTransferRequests() {
    localStorage.setItem('inventory_transfer_requests', JSON.stringify(transferRequests.value))
  }

  // Clean empty default for held sales (No pre-seeded mock records)
  const savedHeldSales = localStorage.getItem('inventory_held_sales')
  const heldSales = ref(savedHeldSales ? JSON.parse(savedHeldSales) : [])

  function saveHeldSales() {
    localStorage.setItem('inventory_held_sales', JSON.stringify(heldSales.value))
  }

  function resetDemoStocks() {
    branchStocks.value = JSON.parse(JSON.stringify(DEFAULT_BRANCH_STOCKS))
    transferRequests.value = []
    heldSales.value = []
    saveBranchStocks()
    saveTransferRequests()
    saveHeldSales()
  }

  // Customer Loyalty List
  const defaultCustomers = [
    { id: 'c-walkin', name: 'Walk-in Retail Buyer', defaultDiscount: 0, tier: 'Retail' },
    {
      id: 'c-bobalove',
      name: 'Boba Bliss Cafe (Loyal Client)',
      defaultDiscount: 5,
      tier: 'Frequent Buyer',
    },
  ]
  const savedCustomers = localStorage.getItem('inventory_customers')
  const customers = ref(savedCustomers ? JSON.parse(savedCustomers) : defaultCustomers)

  function saveOrUpdateCustomer({ name, discount = 0, tier = 'Registered Buyer' }) {
    const cleanName = name.trim()
    if (!cleanName || cleanName.toLowerCase() === 'walk-in retail buyer') return null
    const existingIndex = customers.value.findIndex(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase(),
    )

    let record
    if (existingIndex !== -1) {
      customers.value[existingIndex].defaultDiscount = Number(discount)
      record = customers.value[existingIndex]
    } else {
      record = { id: `c-${Date.now()}`, name: cleanName, defaultDiscount: Number(discount), tier }
      customers.value.push(record)
    }
    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
    return record
  }

  function removeCustomer(customerId) {
    if (customerId === 'c-walkin') return
    customers.value = customers.value.filter((c) => c.id !== customerId)
    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
  }

  // Automated Name Formula
  function generateVariantName(parent, variant) {
    const descriptors = [variant.flavor, variant.subtitle].filter(Boolean).join(' - ')
    return `${parent.brand} ${parent.parentName} · ${descriptors} (${variant.sizeCapacity})`
  }

  function calculateCBM(dim) {
    if (!dim || !dim.lengthCm) return '0.000'
    return ((dim.lengthCm * dim.widthCm * dim.heightCm) / 1000000).toFixed(3)
  }

  // Flattened variant projection
  const flatVariants = computed(() => {
    return catalog.value.flatMap((parent) =>
      parent.variants.map((v) => ({
        ...v,
        parentId: parent.parentId,
        parentName: parent.parentName,
        brand: parent.brand,
        category: parent.category,
        subCategory: parent.subCategory,
        supplier: parent.supplier,
        isPerishable: parent.isPerishable,
        fullName: generateVariantName(parent, v),
      })),
    )
  })

  // Stock In Receiving Action
  const stockInHistory = ref([])
  function receiveStock({ branchId, variantId, inputQty, uomTier, supplierNote, batchExpiry }) {
    const variant = flatVariants.value.find((v) => v.id === variantId)
    if (!variant) return

    let totalBaseUnits = Number(inputQty)
    if (uomTier === 'level2') {
      totalBaseUnits = Number(inputQty) * variant.uom.level2.multiplier
    } else if (uomTier === 'level3') {
      totalBaseUnits =
        Number(inputQty) * variant.uom.level2.multiplier * variant.uom.level3.multiplier
    }

    if (!branchStocks.value[branchId]) {
      branchStocks.value[branchId] = {}
    }
    const current = branchStocks.value[branchId][variantId] || 0
    branchStocks.value[branchId][variantId] = current + totalBaseUnits
    saveBranchStocks()

    const branch = branches.value.find((b) => b.id === branchId)

    stockInHistory.value.unshift({
      id: Date.now(),
      date:
        new Date().toLocaleDateString() +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      productName: variant.fullName,
      inputQty: Number(inputQty),
      uomTierLabel:
        uomTier === 'level1'
          ? variant.uom.level1.unit
          : uomTier === 'level2'
            ? variant.uom.level2.unit
            : variant.uom.level3.unit,
      totalBaseUnits,
      baseUnit: variant.uom.level1.unit,
      note: supplierNote || 'Standard Delivery',
      expiry: batchExpiry || (variant.isPerishable ? 'Batch Tagged' : 'N/A'),
    })
  }

  // POS Sales Action with Selective Profile Updates
  const savedSalesHistory = localStorage.getItem('inventory_sales_history')
  const salesHistory = ref(savedSalesHistory ? JSON.parse(savedSalesHistory) : [])

  function saveSalesHistory() {
    localStorage.setItem('inventory_sales_history', JSON.stringify(salesHistory.value))
  }

  function recordSale({
    branchId,
    variantId,
    quantity,
    customerName,
    buyerDiscountPercent,
    specialDiscountPercent,
    specialReason,
    updateDefaultDiscount = false,
    isHeld = false,
  }) {
    const currentStock = branchStocks.value[branchId]?.[variantId] || 0
    const qty = Number(quantity)

    if (currentStock < qty && !isHeld) {
      throw new Error(`Insufficient stock. Only ${currentStock} left in this branch.`)
    }

    branchStocks.value[branchId][variantId] = Math.max(0, currentStock - qty)
    saveBranchStocks()

    const variant = flatVariants.value.find((v) => v.id === variantId)
    const branch = branches.value.find((b) => b.id === branchId)

    const subtotal = (variant?.baseCost || 0) * qty
    const totalDiscountPercent = Math.min(
      100,
      Number(buyerDiscountPercent || 0) + Number(specialDiscountPercent || 0),
    )
    const discountAmount = subtotal * (totalDiscountPercent / 100)
    const finalTotal = subtotal - discountAmount

    if (customerName && customerName.trim().toLowerCase() !== 'walk-in retail buyer') {
      const existing = customers.value.find(
        (c) => c.name.toLowerCase() === customerName.trim().toLowerCase(),
      )

      if (!existing || updateDefaultDiscount) {
        saveOrUpdateCustomer({
          name: customerName,
          discount: buyerDiscountPercent,
        })
      }
    }

    salesHistory.value.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000000),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      branchId: branchId,
      productName: variant?.fullName || variantId,
      unit: variant?.uom?.level1?.unit || 'unit',
      quantity: qty,
      subtotal,
      totalDiscountPercent,
      discountAmount,
      finalTotal,
      customerName: customerName.trim() || 'Walk-in Retail Buyer',
      specialReason:
        specialReason || (isHeld ? 'On Hold (Pending Inbound Transfer)' : 'Regular Sale'),
      isHeld,
      status: isHeld ? 'On Hold (Pending Transfer)' : 'Completed',
    })

    saveSalesHistory()
    return finalTotal
  }

  // Inter-Branch Stock Request Actions
  function createTransferRequest({
    requestingBranchId,
    fulfillingBranchId,
    variantId,
    qty = 1,
    tier = 'level1',
    totalUnits = null,
    notes = '',
    holdSale = false,
    heldCustomerName = '',
  }) {
    const variant = flatVariants.value.find((v) => v.id === variantId)
    if (!variant) throw new Error('Variant not found')

    let units = totalUnits
    if (!units) {
      const l2 = variant.uom?.level2?.multiplier || 1
      const l3 = variant.uom?.level3?.multiplier || 1
      if (tier === 'level3') units = qty * l2 * l3
      else if (tier === 'level2') units = qty * l2
      else units = qty
    }

    const newReq = {
      id: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      requestingBranchId,
      fulfillingBranchId,
      variantId,
      qty: Number(qty),
      tier,
      totalUnits: Number(units),
      status: 'pending',
      manifestNo: '',
      notes: notes || 'Branch Stock Replenishment Request',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dispatchedAt: null,
      receivedAt: null,
      holdSale,
      heldCustomerName,
    }

    transferRequests.value.unshift(newReq)
    saveTransferRequests()
    return newReq
  }

  function dispatchTransferRequest(requestId, { courierNotes = '', manifestNo = '' } = {}) {
    const req = transferRequests.value.find((r) => r.id === requestId)
    if (!req) throw new Error('Transfer request not found')
    if (req.status !== 'pending') throw new Error('Request is not in pending state')

    if (!branchStocks.value[req.fulfillingBranchId]) {
      branchStocks.value[req.fulfillingBranchId] = {}
    }
    const available = branchStocks.value[req.fulfillingBranchId][req.variantId] || 0
    if (available < req.totalUnits) {
      throw new Error(
        `Insufficient stock in fulfilling branch. Needs ${req.totalUnits}, but only ${available} available.`,
      )
    }

    // Deduct stock from the fulfilling warehouse immediately upon dispatch
    branchStocks.value[req.fulfillingBranchId][req.variantId] = available - req.totalUnits
    saveBranchStocks()

    req.status = 'in_transit'
    req.manifestNo =
      manifestNo || `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    req.dispatchedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (courierNotes) req.courierNotes = courierNotes

    saveTransferRequests()
    return req
  }

  function receiveTransferRequest(requestId) {
    const req = transferRequests.value.find((r) => r.id === requestId)
    if (!req) throw new Error('Transfer request not found')
    if (req.status !== 'in_transit') throw new Error('Request is not in transit')

    // Credit units into the receiving store's inventory
    if (!branchStocks.value[req.requestingBranchId]) {
      branchStocks.value[req.requestingBranchId] = {}
    }
    const current = branchStocks.value[req.requestingBranchId][req.variantId] || 0
    branchStocks.value[req.requestingBranchId][req.variantId] = current + req.totalUnits
    saveBranchStocks()

    // Transition status to completed.
    // NOTE: This does NOT auto-complete the sale in POS — it simply marks the freight received!
    req.status = 'completed'
    req.receivedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    saveTransferRequests()
    return req
  }

  function cancelTransferRequest(requestId) {
    const req = transferRequests.value.find((r) => r.id === requestId)
    if (!req) return
    if (req.status === 'in_transit') {
      const current = branchStocks.value[req.fulfillingBranchId]?.[req.variantId] || 0
      branchStocks.value[req.fulfillingBranchId][req.variantId] = current + req.totalUnits
      saveBranchStocks()
    }
    req.status = 'cancelled'
    saveTransferRequests()
  }

  // Held Orders Actions (Separated from direct checkouts)
  function createHeldSale({
    branchId,
    customerName,
    items = [],
    totalAmount,
    discountPercent = 0,
    requestId = '',
    requestIds = [],
    sourceBranchId = 'b-commissary',
    sourceBranchName = 'Main Commissary / Central Hub',
    specialReason = '',
  }) {
    const orderRef = `ORD-${Date.now().toString().slice(-6)}`
    const newHold = {
      id: `HOLD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      orderRef,
      branchId,
      customerName: customerName || 'Walk-in Retail Buyer',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requestId,
      requestIds: requestIds.length ? requestIds : requestId ? [requestId] : [],
      sourceBranchId,
      sourceBranchName,
      totalAmount: Number(totalAmount) || 0,
      discountPercent: Number(discountPercent) || 0,
      specialReason: specialReason || '',
      items: JSON.parse(JSON.stringify(items)),
    }
    heldSales.value.unshift(newHold)
    saveHeldSales()
    return newHold
  }

  function completeHeldSale(holdId) {
    const idx = heldSales.value.findIndex((h) => h.id === holdId)
    if (idx === -1) throw new Error('Held order not found')
    const hold = heldSales.value[idx]

    // Verify and deduct stock for each item from receiving branch inventory
    hold.items.forEach((item) => {
      if (!branchStocks.value[hold.branchId]) {
        branchStocks.value[hold.branchId] = {}
      }
      const cur = branchStocks.value[hold.branchId][item.variantId] || 0
      branchStocks.value[hold.branchId][item.variantId] = Math.max(0, cur - item.quantity)

      const variant = flatVariants.value.find((v) => v.id === item.variantId)
      const branch = branches.value.find((b) => b.id === hold.branchId)

      salesHistory.value.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000000),
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        branchName: branch?.name || hold.branchId,
        branchId: hold.branchId,
        productName: item.fullName || variant?.fullName || item.variantId,
        unit: item.unit || variant?.uom?.level1?.unit || 'unit',
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
        totalDiscountPercent: hold.discountPercent || 0,
        discountAmount: item.unitPrice * item.quantity * ((hold.discountPercent || 0) / 100),
        finalTotal: item.unitPrice * item.quantity * (1 - (hold.discountPercent || 0) / 100),
        customerName: hold.customerName,
        specialReason: `[${hold.orderRef}] Released from Hold · Transfer ${hold.requestId || 'Delivery'} Complete`,
        isHeld: false,
        status: 'Completed (Released to Client)',
      })
    })

    saveBranchStocks()
    saveSalesHistory()

    // Remove from held queue
    heldSales.value.splice(idx, 1)
    saveHeldSales()
    return hold
  }

  function cancelHeldSale(holdId) {
    const idx = heldSales.value.findIndex((h) => h.id === holdId)
    if (idx !== -1) {
      heldSales.value.splice(idx, 1)
      saveHeldSales()
    }
  }

  return {
    branches,
    catalog,
    flatVariants,
    branchStocks,
    customers,
    stockInHistory,
    salesHistory,
    transferRequests,
    heldSales,
    createHeldSale,
    completeHeldSale,
    cancelHeldSale,
    createTransferRequest,
    dispatchTransferRequest,
    receiveTransferRequest,
    cancelTransferRequest,
    generateVariantName,
    calculateCBM,
    saveOrUpdateCustomer,
    removeCustomer,
    receiveStock,
    recordSale,
    resetDemoStocks,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInventoryStore, import.meta.hot))
}
