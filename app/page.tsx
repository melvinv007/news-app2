/**
 * app/page.tsx — Root redirect to /world
 */
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/world');
}
