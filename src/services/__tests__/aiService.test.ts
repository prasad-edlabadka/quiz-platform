import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTestFromSyllabus } from '../aiService';
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

    it('should generate test successfully', async () => {
        const mockResponseText = JSON.stringify({
            title: 'Generated Test',
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

        const result = await generateTestFromSyllabus(mockApiKey, mockSyllabus);

        expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
        expect(mockGenerateContent).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining(JSON.parse(mockResponseText)));
        expect(result.id).toBeDefined();
    });

    it('should handle JSON cleanup (markdown code blocks)', async () => {
        const rawResponse = '```json\n{"title": "Cleaned Test", "questions": []}\n```';
        
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

        const result = await generateTestFromSyllabus(mockApiKey, mockSyllabus);
        expect(result).toEqual(expect.objectContaining({ title: "Cleaned Test", questions: [] }));
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

        await expect(generateTestFromSyllabus(mockApiKey, mockSyllabus)).rejects.toThrow();
    });

    it('should throw specific safety error if AI rejects content', async () => {
        const safetyRejection = JSON.stringify({
            error: 'safety_violation',
            message: 'This content is inappropriate for study practice.'
        });

        const mockGenerateContent = vi.fn().mockResolvedValue({
            response: {
                text: () => safetyRejection
            }
        });

        (GoogleGenerativeAI as any).mockImplementation(() => ({
            getGenerativeModel: vi.fn().mockReturnValue({
                generateContent: mockGenerateContent
            })
        }));

        await expect(generateTestFromSyllabus(mockApiKey, 'inappropriate prompt'))
            .rejects.toThrow('This content is inappropriate for study practice.');
    });
});
