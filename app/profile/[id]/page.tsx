"use client"

import { useParams } from "next/navigation"
import { ProfilePage } from "@/components/profile-page"

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string

  return <ProfilePage userId={userId} />
}
