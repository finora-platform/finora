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

const ClientForm = ({ initialData = {}, onCancel, mode = "create" }) => {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    pancard: "",
    email: "",
    assigned_rn: "",
    risk: "",
    ekyc_status: "pending",
    plan: "standard",
    created_at: new Date().toISOString(),
    user_id: "",
    ...initialData,
  });

  const { session } = useSession();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        user_id: user.id,
      }));
    }
  }, [user]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Valid email is required";
    if (formData.whatsapp && !formData.whatsapp.match(/^\+?[\d\s-]{10,}$/))
      newErrors.whatsapp = "Valid phone number is required";
  
    // PAN card validation removed
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const client = await createClerkSupabaseClient(session);
      const { data: existingClient, error: fetchError } = await client
        .from("client3")
        .select("email")
        .eq("email", formData.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
      if (existingClient) {
        setErrors((prev) => ({ ...prev, email: "Email already exists!" }));
        setIsLoading(false);
        return;
      }

      const { error: insertError } = await client
        .from("client3")
        .insert([{ ...formData, user_id: String(user.id) }]);

      if (insertError) {
        if (insertError.code === "23505") {
          setErrors((prev) => ({ ...prev, email: "Email already exists!" }));
        } else {
          alert("An error occurred while saving the client.");
        }
        throw insertError;
      }

      alert("Client saved successfully!");
      onCancel();
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto p-6">
      <CardHeader>
        {/* <CardTitle className="text-2xl font-semibold">
          {mode === "create" ? "New Client" : "Edit Client"}
        </CardTitle> */}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block font-medium">Client Name</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              className={`rounded-xl border p-4 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="block font-medium">WhatsApp Number</label>
            <Input
              value={formData.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="+91 98765 43210"
              className={`rounded-xl border p-4 ${errors.whatsapp ? "border-red-500" : ""}`}
            />
            {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp}</p>}
          </div>

          {/* PAN Card */}
          <div className="space-y-2">
            <label className="block font-medium">PAN Card Number</label>
            <Input
              value={formData.pancard}
              onChange={(e) => handleChange("pancard", e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              className={`rounded-xl border p-4 ${errors.pancard ? "border-red-500" : ""}`}
            />
            {errors.pancard && <p className="text-sm text-red-500">{errors.pancard}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              className={`rounded-xl border p-4 ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Assigned RM */}
          <div className="space-y-2">
            <label className="block font-medium">Assigned RM</label>
            <Input
              value={formData.assigned_rn}
              onChange={(e) => handleChange("assigned_rn", e.target.value)}
              placeholder="RM Name"
              className="rounded-xl border p-4"
            />
          </div>

          {/* Risk Profile */}
          <div className="space-y-2">
            <label className="block font-medium">Risk Profile</label>
            <Select value={formData.risk} onValueChange={(value) => handleChange("risk", value)}>
              <SelectTrigger className="rounded-xl border p-4">
                <SelectValue placeholder="Select Risk Profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* eKYC Status */}
          <div className="space-y-2">
            <label className="block font-medium">eKYC Status</label>
            <Select value={formData.ekyc_status} onValueChange={(value) => handleChange("ekyc_status", value)}>
              <SelectTrigger className="rounded-xl border p-4">
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
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <label className="block font-medium">Plan</label>
            <Select value={formData.plan} onValueChange={(value) => handleChange("plan", value)}>
              <SelectTrigger className="rounded-xl border p-4">
                <SelectValue placeholder="Select Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <label className="block font-medium">Created At</label>
            <Input
              type="date"
              value={formData.created_at.split("T")[0]}
              onChange={(e) => handleChange("created_at", e.target.value)}
              className="rounded-xl border p-4"
            />
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {mode === "create" ? "Create Client" : "Update Client"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ClientForm;