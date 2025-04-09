import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useUser, useSession } from '@clerk/nextjs';
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ClientForm = ({ initialData = {}, onCancel, mode = "create" }) => {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    role: "",
    email: "",
    assigned_rn: "",
    risk: "",
    ekyc_status: "pending",
    plan: "standard",
    created_at: new Date().toISOString(),
    user_id: "", // Add user_id field
    ...initialData,
  });

  const { session } = useSession();
  const { user } = useUser();

  // Set user_id when the user is available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        user_id: user.id, // Set the Clerk user ID
      }));
    }
  }, [user]);

  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Valid email is required";
    if (formData.whatsapp && !formData.whatsapp.match(/^\+?[\d\s-]{10,}$/))
      newErrors.whatsapp = "Valid phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle form change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors({}); // Clear all errors when any field changes
  };

  // ✅ Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsLoading(true);
    try {
      // 🔎 First, check if the email already exists
      const client = await createClerkSupabaseClient(session);
      
      const { data: existingClient, error: fetchError } = await client
        .from("client3")
        .select("email")
        .eq("email", formData.email)
        .single();
  
      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }
  
      if (existingClient) {
        // If email exists, show error and prevent duplicate entry
        setErrors((prev) => ({ ...prev, email: "Email already exists!" }));
        setIsLoading(false);
        return;
      }
  
      // 🚀 Insert new client if email is unique
      const { error: insertError } = await client
        .from("client3")
        .insert([{ ...formData, user_id: String(user.id) }]); // Ensure user_id is treated as TEXT  
      if (insertError) {
        if (insertError.code === "23505") {
          setErrors((prev) => ({ ...prev, email: "Email already exists!" }));
        } else {
          alert("An error occurred while saving the client. Please try again.");
        }
        throw insertError;
      }
  
      alert("Client saved successfully!");
      onCancel(); // Close form/modal
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Client" : "Edit Client"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name Field */}
            <Input
              placeholder="Client Name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
            />
            {errors.name && (
              <span id="name-error" className="text-sm text-red-500">
                {errors.name}
              </span>
            )}

            {/* WhatsApp Number */}
            <Input
              placeholder="WhatsApp Number"
              value={formData.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              className={errors.whatsapp ? "border-red-500" : ""}
              aria-invalid={!!errors.whatsapp}
              aria-describedby="whatsapp-error"
            />
            {errors.whatsapp && (
              <span id="whatsapp-error" className="text-sm text-red-500">
                {errors.whatsapp}
              </span>
            )}

            {/* Role */}
            <Input
              placeholder="Role"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
            />

            {/* Email */}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && (
              <span id="email-error" className="text-sm text-red-500">
                {errors.email}
              </span>
            )}

            {/* Assigned RM */}
            <Input
              placeholder="Assigned RM"
              value={formData.assigned_rn}
              onChange={(e) => handleChange("assigned_rn", e.target.value)}
            />

            {/* Risk Profile */}
            <Input
              placeholder="Risk Profile"
              value={formData.risk}
              onChange={(e) => handleChange("risk", e.target.value)}
            />

            {/* eKYC Status */}
            <Select value={formData.ekyc_status} onValueChange={(value) => handleChange("ekyc_status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Verified
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Pending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Plan */}
            <Select value={formData.plan} onValueChange={(value) => handleChange("plan", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
              </SelectContent>
            </Select>

            {/* Created At */}
            <Input
              type="date"
              value={formData.created_at.split("T")[0]}
              onChange={(e) => handleChange("created_at", e.target.value)}
            />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading || Object.keys(errors).length > 0}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {mode === "create" ? "Create Client" : "Update Client"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClientForm;