import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import { randomUUID } from 'crypto';
import { BillRecommendation, CashFlowAnalysis, Bill, Transaction } from '@shared/types';
import { AzureOpenAIError } from '../utils/errors';

class AIService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': '2023-05-15' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
    });
    this.model = process.env.AZURE_OPENAI_MODEL || 'gpt-4';
  }

  async generateBillRecommendations(
    bills: Bill[],
    transactions: Transaction[]
  ): Promise<BillRecommendation[]> {
    try {
      const prompt = this.createBillRecommendationsPrompt(bills, transactions);
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a financial advisor specializing in bill payment optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 800
      });

      return this.parseBillRecommendations(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error generating bill recommendations:', error);
      throw new AzureOpenAIError('Failed to generate bill recommendations');
    }
  }

  async analyzeCashFlow(
    transactions: Transaction[],
    bills: Bill[]
  ): Promise<CashFlowAnalysis> {
    try {
      const prompt = this.createCashFlowAnalysisPrompt(transactions, bills);
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a cash flow analysis expert.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.2,
        max_tokens: 1000
      });

      return this.parseCashFlowAnalysis(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error analyzing cash flow:', error);
      throw new AzureOpenAIError('Failed to analyze cash flow');
    }
  }

  async detectSavingsOpportunities(
    transactions: Transaction[],
    bills: Bill[]
  ): Promise<any[]> {
    try {
      const prompt = this.createSavingsOpportunitiesPrompt(transactions, bills);
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a cost optimization specialist.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: 600
      });

      return this.parseSavingsOpportunities(completion.choices[0].message.content || '');
    } catch (error) {
      console.error('Error detecting savings opportunities:', error);
      throw new AzureOpenAIError('Failed to detect savings opportunities');
    }
  }

  private createBillRecommendationsPrompt(bills: Bill[], transactions: Transaction[]): string {
    const billsData = bills.map(bill => ({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      frequency: bill.frequency,
    }));

    const transactionsData = transactions.map(tx => ({
      amount: tx.amount,
      date: tx.date,
      name: tx.name,
      category: tx.category,
    }));

    return `Analyze the following bills and transactions to provide recommendations for optimizing bill payment schedules:

Bills:
${JSON.stringify(billsData, null, 2)}

Recent Transactions:
${JSON.stringify(transactionsData, null, 2)}

Generate recommendations in the following JSON format:
{
  "recommendations": [
    {
      "billId": "<bill-id>",
      "currentDueDate": "<current-date>",
      "recommendedDueDate": "<recommended-date>",
      "reason": "<detailed explanation>",
      "savingsEstimate": <number>,
      "confidenceScore": <number between 0 and 1>
    }
  ]
}`;
  }

  private createCashFlowAnalysisPrompt(transactions: Transaction[], bills: Bill[]): string {
    return `Analyze the following transactions and bills to provide a cash flow analysis:

Transactions:
${JSON.stringify(transactions, null, 2)}

Bills:
${JSON.stringify(bills, null, 2)}

Generate analysis in the following JSON format:
{
  "incomeDays": ["YYYY-MM-DD"],
  "highExpenseDays": ["YYYY-MM-DD"],
  "lowBalanceDays": ["YYYY-MM-DD"],
  "projectedBalances": [
    {
      "date": "YYYY-MM-DD",
      "balance": <number>
    }
  ],
  "recommendations": [
    {
      "type": "move_bill|reduce_expense|save",
      "description": "<detailed recommendation>",
      "impact": <number>
    }
  ]
}`;
  }

  private createSavingsOpportunitiesPrompt(transactions: Transaction[], bills: Bill[]): string {
    return `Analyze the following transactions and bills to identify savings opportunities:

Transactions:
${JSON.stringify(transactions, null, 2)}

Bills:
${JSON.stringify(bills, null, 2)}

Generate opportunities in the following JSON format:
{
  "opportunities": [
    {
      "type": "duplicate_subscription|high_bill|unused_service",
      "title": "<opportunity title>",
      "description": "<detailed description>",
      "potentialSavings": <number>,
      "confidence": <number between 0 and 1>
    }
  ]
}`;
  }

  private parseBillRecommendations(content: string): BillRecommendation[] {
    try {
      const data = JSON.parse(content);
      return data.recommendations.map((rec: any) => ({
        id: randomUUID(),
        userId: 'system',
        billId: rec.billId,
        currentDueDate: rec.currentDueDate,
        recommendedDueDate: rec.recommendedDueDate,
        reason: rec.reason,
        savingsEstimate: rec.savingsEstimate,
        confidenceScore: rec.confidenceScore,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      }));
    } catch (error) {
      console.error('Error parsing bill recommendations:', error);
      return [];
    }
  }

  private parseCashFlowAnalysis(content: string): CashFlowAnalysis {
    try {
      const data = JSON.parse(content);
      return {
        id: randomUUID(),
        userId: 'system',
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        incomeDays: data.incomeDays,
        highExpenseDays: data.highExpenseDays,
        lowBalanceDays: data.lowBalanceDays,
        projectedBalances: data.projectedBalances,
        recommendations: data.recommendations,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Error parsing cash flow analysis:', error);
      throw new AzureOpenAIError('Failed to parse cash flow analysis');
    }
  }

  private parseSavingsOpportunities(content: string): any[] {
    try {
      const data = JSON.parse(content);
      return data.opportunities.map((opp: any) => ({
        id: randomUUID(),
        ...opp,
        created_at: new Date()
      }));
    } catch (error) {
      console.error('Error parsing savings opportunities:', error);
      return [];
    }
  }
}

export default AIService;