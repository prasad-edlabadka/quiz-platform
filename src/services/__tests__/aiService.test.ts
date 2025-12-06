import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuizFromSyllabus } from '../aiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the Google Generative AI SDK
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: vi.fn()
            })
        }))
    };
});

describe('aiService', () => {
    const mockApiKey = 'test-api-key';
    const mockSyllabus = 'Test Syllabus';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate quiz successfully', async () => {
        const mockResponseText = JSON.stringify({
            title: 'Generated Quiz',
            questions: []
        });

        // Setup mock return
        const mockGenerateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        (GoogleGenerativeAI as any).mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }));

        const result = await generateQuizFromSyllabus(mockApiKey, mockSyllabus);

        expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
        expect(mockGenerateContent).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining(JSON.parse(mockResponseText)));
        expect(result.id).toBeDefined();
    });

    it('should handle JSON cleanup (markdown code blocks)', async () => {
        const rawResponse = '```json\n{"title": "Cleaned Quiz", "questions": []}\n```';
        
         const mockGenerateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => rawResponse
            }
        });

        (GoogleGenerativeAI as any).mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }));

        const result = await generateQuizFromSyllabus(mockApiKey, mockSyllabus);
        expect(result).toEqual(expect.objectContaining({ title: "Cleaned Quiz", questions: [] }));
        expect(result.id).toBeDefined();
    });

     it('should throw error on invalid JSON', async () => {
         const mockGenerateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => 'Invalid JSON'
            }
        });

        (GoogleGenerativeAI as any).mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }));

        await expect(generateQuizFromSyllabus(mockApiKey, mockSyllabus)).rejects.toThrow();
    });
});
