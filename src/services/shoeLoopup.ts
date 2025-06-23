import OpenAI from 'openai';
import type {
  ShoeSearchRequest,
  ShoeSearchResult,
  ShoeLookupResult,
  ShoeImage,
  ShoeVariant,
  CushioningLevel,
  TerrainType,
  StabilityType,
  UpperMaterial,
  OutsoleMaterial,
  RunningType,
} from '~/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // This should run server-side
});

interface ShoeSearchFunction {
  name: 'search_running_shoes';
  description: 'Search for running shoe information including specs, images, and variants';
  parameters: {
    type: 'object';
    properties: {
      query: {
        type: 'string';
        description: 'The shoe name, brand and model to search for';
      };
      exact_match: {
        type: 'boolean';
        description: 'Whether to search for exact matches only';
      };
    };
    required: ['query'];
  };
}

interface ShoeDataFunction {
  name: 'get_shoe_specifications';
  description: 'Get detailed specifications for a specific running shoe';
  parameters: {
    type: 'object';
    properties: {
      brand: { type: 'string'; description: 'Shoe brand name' };
      model: { type: 'string'; description: 'Shoe model name' };
      year: { type: 'number'; description: 'Release year (optional)' };
    };
    required: ['brand', 'model'];
  };
}

const SHOE_LOOKUP_FUNCTIONS: (ShoeSearchFunction | ShoeDataFunction)[] = [
  {
    name: 'search_running_shoes',
    description: 'Search for running shoe information including specs, images, and variants',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The shoe name, brand and model to search for',
        },
        exact_match: {
          type: 'boolean',
          description: 'Whether to search for exact matches only',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_shoe_specifications',
    description: 'Get detailed specifications for a specific running shoe',
    parameters: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Shoe brand name' },
        model: { type: 'string', description: 'Shoe model name' },
        year: { type: 'number', description: 'Release year (optional)' },
      },
      required: ['brand', 'model'],
    },
  },
];

const SYSTEM_PROMPT = `
You are a running shoe expert with access to comprehensive databases of running shoe information.
Your role is to help users find detailed information about running shoes including:

1. Technical specifications (weight, drop, stack height, cushioning level)
2. Materials and construction details
3. Recommended use cases and terrain types
4. Available colorways and variants
5. Professional reviews and ratings
6. Pricing and availability information

When searching for shoes:
- Always try to identify the exact brand and model
- Provide comprehensive technical specifications
- Include multiple high-quality image URLs when available
- Suggest appropriate colorway options
- Give realistic expected mileage estimates
- Categorize cushioning level and terrain suitability accurately

For technical specifications, use these guidelines:
- Weight: in ounces for men's size 9
- Drop: heel-to-toe offset in millimeters
- Stack height: heel and forefoot measurements in millimeters
- Cushioning levels: minimal (0-15mm stack), light (15-25mm), moderate (25-35mm), maximum (35mm+)
- Expected mileage: conservative estimates (300-500 miles for most shoes)

Always provide structured, accurate data that runners can use to make informed decisions.
`;

export class ShoeLoopupService {
  private static instance: ShoeLoopupService;

  public static getInstance(): ShoeLoopupService {
    if (!ShoeLoopupService.instance) {
      ShoeLoopupService.instance = new ShoeLoopupService();
    }
    return ShoeLoopupService.instance;
  }

  async searchShoes(request: ShoeSearchRequest): Promise<ShoeSearchResult> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Search for running shoes: "${request.query}". I need comprehensive information including specifications, images, and available variants. ${
              request.filters
                ? `Apply these filters: ${JSON.stringify(request.filters)}`
                : ''
            }`,
          },
        ],
        functions: SHOE_LOOKUP_FUNCTIONS,
        function_call: { name: 'search_running_shoes' },
        temperature: 0.1,
        max_tokens: 2000,
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall) {
        throw new Error('No function call in OpenAI response');
      }

      // In a real implementation, this would call external APIs
      // For now, we'll simulate the function call response
      const searchResults = await this.simulateShoeSearch(request.query);

      return {
        shoes: searchResults,
        total: searchResults.length,
        query: request.query,
      };
    } catch (error) {
      console.error('Error searching shoes:', error);
      throw new Error('Failed to search for shoes. Please try again.');
    }
  }

  async getShoeDetails(brand: string, model: string, year?: number): Promise<ShoeLookupResult | null> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Get detailed specifications for the ${brand} ${model}${
              year ? ` (${year})` : ''
            }. Include all technical details, materials, recommended use cases, and available variants.`,
          },
        ],
        functions: SHOE_LOOKUP_FUNCTIONS,
        function_call: { name: 'get_shoe_specifications' },
        temperature: 0.1,
        max_tokens: 2000,
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall) {
        throw new Error('No function call in OpenAI response');
      }

      // Simulate detailed shoe lookup
      return await this.simulateShoeDetails(brand, model, year);
    } catch (error) {
      console.error('Error getting shoe details:', error);
      return null;
    }
  }

  // Simulation methods - replace with actual API calls in production
  private async simulateShoeSearch(query: string): Promise<ShoeLookupResult[]> {
    // This would typically call running shoe databases, retailer APIs, etc.
    const mockResults: ShoeLookupResult[] = [
      {
        name: 'Nike Air Zoom Pegasus 40',
        brand: 'Nike',
        model: 'Air Zoom Pegasus 40',
        year: 2023,
        msrp: 130,
        weight: 10.6,
        dropHeight: 10,
        stackHeight: { heel: 28, forefoot: 18 },
        cushioningLevel: 'moderate' as CushioningLevel,
        terrainType: ['road', 'treadmill'] as TerrainType[],
        stabilityType: 'neutral' as StabilityType,
        upperMaterial: 'mesh' as UpperMaterial,
        midsoleTechnology: ['React foam', 'Zoom Air'],
        outsoleMaterial: 'rubber' as OutsoleMaterial,
        recommendedFor: ['daily-trainer', 'long-run'] as RunningType[],
        expectedMileage: 400,
        description: 'A versatile daily trainer with responsive cushioning',
        keyFeatures: [
          'React foam midsole for soft responsiveness',
          'Zoom Air unit in forefoot for energy return',
          'Engineered mesh upper for breathability',
          'Durable rubber outsole with waffle pattern',
        ],
        images: [
          {
            url: 'https://example.com/pegasus40-main.jpg',
            alt: 'Nike Air Zoom Pegasus 40 main view',
            type: 'main',
          },
          {
            url: 'https://example.com/pegasus40-side.jpg',
            alt: 'Nike Air Zoom Pegasus 40 side view',
            type: 'side',
          },
        ],
        variants: [
          {
            colorway: 'Black/White',
            images: [
              {
                url: 'https://example.com/pegasus40-black.jpg',
                alt: 'Nike Air Zoom Pegasus 40 Black/White',
                type: 'main',
              },
            ],
            availability: true,
            price: 130,
          },
          {
            colorway: 'Navy/Blue',
            images: [
              {
                url: 'https://example.com/pegasus40-navy.jpg',
                alt: 'Nike Air Zoom Pegasus 40 Navy/Blue',
                type: 'main',
              },
            ],
            availability: true,
            price: 130,
          },
        ],
        reviews: {
          averageRating: 4.2,
          totalReviews: 1250,
          summary: 'Reliable daily trainer with good durability and comfort',
        },
      },
    ];

    // Filter results based on query
    return mockResults.filter(shoe =>
      shoe.name.toLowerCase().includes(query.toLowerCase()) ||
      shoe.brand.toLowerCase().includes(query.toLowerCase()) ||
      shoe.model.toLowerCase().includes(query.toLowerCase())
    );
  }

  private async simulateShoeDetails(brand: string, model: string, year?: number): Promise<ShoeLookupResult> {
    // Mock detailed shoe data
    return {
      name: `${brand} ${model}`,
      brand,
      model,
      year: year || 2023,
      msrp: 140,
      weight: 9.8,
      dropHeight: 8,
      stackHeight: { heel: 32, forefoot: 24 },
      cushioningLevel: 'maximum' as CushioningLevel,
      terrainType: ['road'] as TerrainType[],
      stabilityType: 'neutral' as StabilityType,
      upperMaterial: 'knit' as UpperMaterial,
      midsoleTechnology: ['DNA LOFT', 'BioMoGo DNA'],
      outsoleMaterial: 'blown-rubber' as OutsoleMaterial,
      recommendedFor: ['daily-trainer', 'long-run', 'recovery'] as RunningType[],
      expectedMileage: 450,
      description: 'Premium cushioned running shoe for comfort-focused runners',
      keyFeatures: [
        'Plush DNA LOFT cushioning',
        'Smooth heel-to-toe transitions',
        'Breathable engineered mesh upper',
        'Segmented crash pad for smooth landings',
      ],
      images: [
        {
          url: `https://example.com/${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-main.jpg`,
          alt: `${brand} ${model} main view`,
          type: 'main',
        },
      ],
      variants: [
        {
          colorway: 'Black/Grey',
          images: [
            {
              url: `https://example.com/${brand.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-black.jpg`,
              alt: `${brand} ${model} Black/Grey`,
              type: 'main',
            },
          ],
          availability: true,
          price: 140,
        },
      ],
      reviews: {
        averageRating: 4.5,
        totalReviews: 890,
        summary: 'Excellent comfort and cushioning for daily training',
      },
    };
  }

  // Utility methods for shoe data analysis
  static analyzeCushioningLevel(stackHeight: { heel: number; forefoot: number }): CushioningLevel {
    const maxStack = Math.max(stackHeight.heel, stackHeight.forefoot);
    if (maxStack <= 15) return 'minimal';
    if (maxStack <= 25) return 'light';
    if (maxStack <= 35) return 'moderate';
    return 'maximum';
  }

  static determineTerrainSuitability(
    outsoleMaterial: OutsoleMaterial,
    model: string
  ): TerrainType[] {
    const terrains: TerrainType[] = ['road', 'treadmill'];

    if (model.toLowerCase().includes('trail')) {
      terrains.push('trail');
    }

    if (outsoleMaterial === 'carbon-rubber') {
      terrains.push('track');
    }

    return terrains;
  }

  static estimateExpectedMileage(
    cushioningLevel: CushioningLevel,
    outsoleMaterial: OutsoleMaterial
  ): number {
    let baseMileage = 350;

    // Adjust for cushioning
    switch (cushioningLevel) {
      case 'minimal':
        baseMileage = 300;
        break;
      case 'light':
        baseMileage = 350;
        break;
      case 'moderate':
        baseMileage = 400;
        break;
      case 'maximum':
        baseMileage = 450;
        break;
    }

    // Adjust for outsole material
    switch (outsoleMaterial) {
      case 'carbon-rubber':
        baseMileage += 100;
        break;
      case 'blown-rubber':
        baseMileage -= 50;
        break;
      default:
        break;
    }

    return baseMileage;
  }
}

export const shoeLoopupService = ShoeLoopupService.getInstance();
