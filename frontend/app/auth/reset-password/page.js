import { Suspense } from 'react'
import ResetPassword from '../../../components/auth/ResetPassword'

function ResetPasswordContent() {
  return <ResetPassword />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
