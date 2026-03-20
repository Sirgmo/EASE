import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { getJobStatus, getJobResult } from '@/lib/ai/job-queue'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<Response> {
  await headers()
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { jobId } = await params
  const status = await getJobStatus(jobId)

  if (status === null) {
    return Response.json({ error: 'Job not found' }, { status: 404 })
  }

  const result = status === 'complete' ? await getJobResult(jobId) : null

  return Response.json({ jobId, status, result })
}
