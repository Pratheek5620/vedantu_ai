'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TimetableResponse {
  timetable: string
  error?: string
}

interface TimetableRow {
  Days: string
  timeSlot: string
  sunday: string
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
}

function parseTimetableResponse(markdown: string): TimetableRow[] {
  const lines = markdown.split('\n')
  return lines
    .slice(2) // Skip header and separator
    .filter(line => line.trim().length > 0 && line.includes('|'))
    .map(line => {
      const [Days, timeSlot, sunday, monday, tuesday, wednesday, thursday, friday, saturday] = line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim())
      return { Days, timeSlot, sunday, monday, tuesday, wednesday, thursday, friday, saturday }
    })
}

export default function TimetableForm() {
  const [formData, setFormData] = useState<{
    classLevel: string;
    targetExam: string;
    startTime: string;
    endTime: string;
    numberOfDays: string;
    purpose: string;
    subjects: string[];
    chapters: string[];
  }>({
    classLevel: '',
    targetExam: '',
    startTime: '09:00',
    endTime: '17:00',
    numberOfDays: '30',
    purpose: '',
    subjects: [],
    chapters: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timetable, setTimetable] = useState<TimetableRow[] | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setTimetable(null)

    // Validate time range
    const start = new Date(`2000-01-01T${formData.startTime}`)
    const end = new Date(`2000-01-01T${formData.endTime}`)
    
    if (end <= start) {
      setError('End time must be after start time')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/generate-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data: TimetableResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate timetable')
      }

      const parsedTimetable = parseTimetableResponse(data.timetable)
      setTimetable(parsedTimetable)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getCellClassName = (content: string | undefined) => {
    if (!content) return 'bg-white'
    const lowercaseContent = content.toLowerCase()
    if (lowercaseContent.includes('school')) return 'bg-white'
    if (lowercaseContent.includes('break')) return 'bg-yellow-100'
    if (lowercaseContent.includes('quiz')) return 'bg-gray-200'
    if (lowercaseContent.includes('list the doubts')) return 'bg-gray-50'
    return 'bg-white'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Create Your Study Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Class Level</Label>
                <RadioGroup
                  value={formData.classLevel}
                  onValueChange={(value) => setFormData({ ...formData, classLevel: value })}
                  className="grid grid-cols-2 gap-2"
                >
                  {['10', '11', '12', 'Repeater'].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`class-${option}`} />
                      <Label htmlFor={`class-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-4">
              <Label className="flex items-center">
                Which subjects need to be included in the time-table? (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'].map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject}`}
                      checked={formData.subjects.includes(subject)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          subjects: checked
                            ? [...prev.subjects, subject]
                            : prev.subjects.filter((s) => s !== subject),
                        }))
                      }}
                    />
                    <Label htmlFor={`subject-${subject}`}>{subject}</Label>
                  </div>
                ))}
              </div>
            </div>
             {/* Chapters (Optional) */}
             <div className="space-y-4">
              <Label htmlFor="chapters" className="flex items-center">
                Specify the chapters to be included in the time-table (Optional)
              </Label>
              <Textarea
                id="chapters"
                placeholder="Enter chapter names or numbers, separated by commas"
                value={formData.chapters}
                onChange={(e) => setFormData({ ...formData, chapters: e.target.value.split(',').map(chapter => chapter.trim()) })}
                className="min-h-[100px]"
              />
            </div>


              <div className="space-y-4">
                <Label>Target Exam</Label>
                <RadioGroup
                  value={formData.targetExam}
                  onValueChange={(value) => setFormData({ ...formData, targetExam: value })}
                  className="grid grid-cols-3 gap-2"
                >
                  {['JEE', 'NEET', 'Others'].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`exam-${option}`} />
                      <Label htmlFor={`exam-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label>Study Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-xs">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="number-of-days">Number of Days</Label>
                <Input
                  id="number-of-days"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.numberOfDays}
                  onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                  placeholder="Enter number of days"
                />
              </div>

              <div className="space-y-4">
                <Label>Purpose</Label>
                <RadioGroup
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({ ...formData, purpose: value })}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    'Revisions',
                    'Syllabus completion',
                    'Clearing Backlogs',
                    'Competative-exams'
                  ].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`purpose-${option}`} />
                      <Label htmlFor={`purpose-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Timetable...
                </>
              ) : (
                'Generate Timetable'
              )}
            </Button>
          </form>

          {timetable && (
            <div className="mt-8">
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                      <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Days
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Time Slot
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Sunday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Monday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Tuesday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Wednesday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Thursday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Friday
                        </th>
                        <th className="bg-yellow-200 px-3 py-2 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                          Saturday
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {timetable.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 bg-gray-50">
                            {row.Days}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 bg-gray-50">
                            {row.timeSlot}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.monday)}`}>
                            {row.monday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.tuesday)}`}>
                            {row.tuesday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.wednesday)}`}>
                            {row.wednesday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.thursday)}`}>
                            {row.thursday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.friday)}`}>
                            {row.friday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.saturday)}`}>
                            {row.saturday}
                          </td>
                          <td className={`px-3 py-2 text-xs ${getCellClassName(row.sunday)}`}>
                            {row.sunday}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
