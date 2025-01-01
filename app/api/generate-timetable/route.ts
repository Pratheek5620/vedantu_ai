import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'

export async function POST(request: Request) {
  try {
    const { 
      classLevel, 
      stream, 
      targetExam, 
      startTime,
      endTime,
      numberOfDays,
      purpose 
    } = await request.json()

    // Validate input
    if (!classLevel || !stream || !targetExam || !startTime || !endTime || !numberOfDays || !purpose) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Calculate hours per session based on time range
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const hoursPerDay = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    // Construct prompt
    const prompt = `You are an expert in education planning for Indian students based on the NCERT syllabus. Create a detailed study timetable for a student with the following details:
- **Class Level**: ${classLevel}
- **Stream**: ${stream}
- **Target Exam**: ${targetExam}
- **Daily Schedule**: From ${startTime} to ${endTime} (${parseInt(endTime) - parseInt(startTime)} hours per day)
- **Purpose**: ${purpose}

### Instructions:
1. Allocate study hours equally across NCERT subjects for the given class and stream.
2. Incorporate logical sequencing of chapters/topics from NCERT, starting with fundamentals and progressively moving to advanced concepts.
3. Divide daily hours among subjects, ensuring:
   - Balanced distribution for core subjects (e.g., Math, Physics, Chemistry, Biology(If chosen NEET)).
   - Logical time intervals for each chapter/topic.
   - Include short breaks for better productivity.
4. Include a "Review/Practice" day every Friday.
5. Use these columns in the timetable:
   | Time duration | Monday | Tuesday | Wednesday | Thursday | Friday |
6. For each day, provide:
   - Subject
   - Chapter/Topic
7. Base your plan on NCERT guidelines and the target exam's requirements.

Example format:
| Time duration             | Monday | Tuesday | Wednesday | Thursday | Friday |
|-----------------------|--------|---------|-----------|----------|--------|   
|${startTime}-${endTime}|        |         |           |          |        |

Based on the student's stream and target exam, create an appropriate curriculum that covers all necessary topics for ${numberOfDays} days.
Ensure topics are sequenced properly with fundamentals first, then advanced concepts.`

    // Generate timetable using Groq
    const { text: timetable } = await generateText({
      model: groq('mixtral-8x7b-32768'),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return NextResponse.json({ timetable })
  } catch (error) {
    console.error('Error generating timetable:', error)
    return NextResponse.json(
      { error: 'Failed to generate timetable' },
      { status: 500 }
    )
  }
}


export const runtime = "edge";
