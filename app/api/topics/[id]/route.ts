import { NextRequest, NextResponse } from 'next/server';
// import { getTopicBySlug } from '@/data/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    // Use the centralized query
    // const topic = await getTopicBySlug(id);
    const topic = null; // Temporarily disabled
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(topic);
    
  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
