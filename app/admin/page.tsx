import { redirect } from "next/navigation";

export default function page() {
  redirect("/admin/dashboard");
  
    return (
      <div>Welcome to the Admin Panel</div>
    );
  }
  