"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveUserProfile, getUserProfile } from "@/actions/user";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

type DocState = {
  fileName: string;
  url: string;       // Cloudinary secure_url
  publicId: string;  // Cloudinary public_id
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [docStates, setDocStates] = useState<Record<string, DocState>>({});

  useEffect(() => {
    async function loadData() {
      const data = await getUserProfile();
      if (data) {
        // Format date for HTML date input (YYYY-MM-DD)
        if (data.dateOfBirth) {
          data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
        }
        setProfile(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mark as uploading immediately so the UI updates
    setDocStates(prev => ({
      ...prev,
      [docType]: { fileName: file.name, url: '', publicId: '', status: 'uploading' },
    }));

    // 1️⃣ Upload the file to disk so it persists across navigations
    const uploadBody = new FormData();
    uploadBody.append('file', file);
    uploadBody.append('docType', docType);

    let uploadedUrl = '';
    try {
      const uploadRes = await fetch('/api/upload-document', { method: 'POST', body: uploadBody });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.success) throw new Error(uploadResult.error ?? 'Upload failed');

      uploadedUrl = uploadResult.url;
      setDocStates(prev => ({
        ...prev,
        [docType]: { fileName: file.name, url: uploadedUrl, publicId: uploadResult.publicId ?? '', status: 'done' },
      }));
      console.log(`✅ Cloudinary upload: ${uploadedUrl}`);
    } catch (err: any) {
      setDocStates(prev => ({
        ...prev,
        [docType]: { fileName: file.name, url: '', publicId: '', status: 'error', error: err.message },
      }));
      console.error(`Upload failed for ${docType}:`, err.message);
      return; // Don't attempt parse if upload failed
    }

    // 2️⃣ Concurrently try to auto-fill from the document (non-blocking)
    try {
      console.log(`Starting auto-fill for ${docType}...`);
      const parseBody = new FormData();
      parseBody.append('file', file);
      parseBody.append('documentType', docType);

      const parseRes = await fetch('/api/parse-document', { method: 'POST', body: parseBody });
      const parseResult = await parseRes.json();

      if (parseResult.success && parseResult.data) {
        autoFillForm(parseResult.data);
        console.log(`Auto-fill completed for ${docType}`);
      } else {
        console.warn(`Auto-fill skipped for ${docType}: ${parseResult.error}`);
      }
    } catch (err) {
      console.warn(`Auto-fill error for ${docType} (non-fatal):`, err);
    }
  };

  const autoFillForm = (extractedData: any) => {
    const form = document.querySelector('form');
    if (!form) return;

    Object.entries(extractedData).forEach(([fieldName, value]) => {
      const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLSelectElement;
      if (field && value) {
        field.value = String(value);
        field.classList.add('bg-green-50', 'border-green-300');
        const removeHighlight = () => {
          field.classList.remove('bg-green-50', 'border-green-300');
          field.removeEventListener('focus', removeHighlight);
          field.removeEventListener('change', removeHighlight);
        };
        field.addEventListener('focus', removeHighlight);
        field.addEventListener('change', removeHighlight);
      }
    });

    const msg = document.createElement('div');
    msg.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
    msg.textContent = '✅ Form auto-filled with extracted data. Please review and edit if needed.';
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 5000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Block submit if any doc is still uploading
    const stillUploading = Object.values(docStates).some(d => d.status === 'uploading');
    if (stillUploading) {
      alert('Please wait — documents are still uploading.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    // Append stored document metadata (strings only — no binary files)
    Object.entries(docStates).forEach(([docType, doc]) => {
      if (doc.url) {
        formData.append(`docUrl_${docType}`, doc.url);
        formData.append(`docName_${docType}`, doc.fileName);
        formData.append(`docPublicId_${docType}`, doc.publicId);
      }
    });

    try {
      await saveUserProfile(formData);
      router.push("/home");
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-500 animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {profile ? "Update Your Profile" : "Complete Your Profile"}
          </h1>
          <p className="text-lg text-gray-600">
            Keep your details up to date to find the best scholarships.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning={true}>
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  type="text"
                  defaultValue={profile?.name || ""}
                  placeholder="Your full name"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={profile?.dateOfBirth || ""}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender <span className="text-red-500">*</span></label>
                <select
                  name="gender"
                  defaultValue={profile?.gender || ""}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nationality <span className="text-red-500">*</span></label>
                <input
                  name="nationality"
                  type="text"
                  defaultValue={profile?.nationality || "Indian"}
                  placeholder="e.g., Indian"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Education Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Education Level <span className="text-red-500">*</span></label>
                <select
                  name="educationLevel"
                  defaultValue={profile?.educationLevel || ""}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                >
                  <option value="">Select Level</option>
                  <option value="High School">High School</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Course / Major <span className="text-red-500">*</span></label>
                <input
                  name="course"
                  type="text"
                  defaultValue={profile?.course || ""}
                  placeholder="e.g., B.Tech CSE"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">University/Institution <span className="text-red-500">*</span></label>
                <input
                  name="university"
                  type="text"
                  defaultValue={profile?.university || ""}
                  placeholder="e.g., IIT Delhi"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expected Graduation Year <span className="text-red-500">*</span></label>
                <input
                  name="graduationYear"
                  type="number"
                  min="2024"
                  max="2030"
                  defaultValue={profile?.graduationYear || ""}
                  placeholder="e.g., 2025"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current CGPA <span className="text-red-500">*</span></label>
                <input
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  defaultValue={profile?.cgpa || ""}
                  placeholder="e.g., 7.5"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
                <p className="text-xs text-gray-500 mt-1">Scale: 0-10</p>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Location Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Country <span className="text-red-500">*</span></label>
                <input
                  name="country"
                  type="text"
                  defaultValue={profile?.country || "India"}
                  placeholder="e.g., India"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State/Province <span className="text-red-500">*</span></label>
                <input
                  name="state"
                  type="text"
                  defaultValue={profile?.state || ""}
                  placeholder="e.g., Punjab"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>

          {/* Financial & Category Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Financial & Category Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Annual Family Income (₹) <span className="text-red-500">*</span></label>
                <input
                  name="income"
                  type="number"
                  defaultValue={profile?.income || ""}
                  placeholder="e.g., 400000"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category <span className="text-red-500">*</span></label>
                <select
                  name="category"
                  defaultValue={profile?.category || ""}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  suppressHydrationWarning
                >
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="disability"
                  type="checkbox"
                  defaultChecked={profile?.disability || false}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  suppressHydrationWarning
                />
                <span className="text-sm font-medium">I have a disability (PwD)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="firstGeneration"
                  type="checkbox"
                  defaultChecked={profile?.firstGeneration || false}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  suppressHydrationWarning
                />
                <span className="text-sm font-medium">First generation learner</span>
              </label>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Document Upload</h2>
            <p className="text-sm text-gray-600 mb-6">
              Upload important documents that may be required for scholarship applications.
              Supported formats: PDF, JPG, PNG (Max 5MB per file)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { type: "income", label: "Income Certificate", required: true },
                { type: "resume", label: "Resume/CV", required: true },
                { type: "marksheet", label: "Latest Mark Sheet", required: true },
                { type: "idproof", label: "ID Proof", required: true },
                { type: "category", label: "Category Certificate", required: false },
                { type: "disability", label: "Disability Certificate", required: false },
              ].map((doc) => {
                const ds = docStates[doc.type];
                return (
                  <div key={doc.type} className={`border-2 border-dashed rounded-lg p-4 transition-colors ${ds?.status === 'done' ? 'border-green-400 bg-green-50' :
                    ds?.status === 'error' ? 'border-red-400 bg-red-50' :
                      'border-gray-300'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium">{doc.label}</span>
                        {doc.required && <span className="text-red-500">*</span>}
                      </label>
                      {/* Status icon */}
                      {ds?.status === 'uploading' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {ds?.status === 'done' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {ds?.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, doc.type)}
                      className="hidden"
                      id={`file-${doc.type}`}
                      disabled={ds?.status === 'uploading'}
                    />

                    <label
                      htmlFor={`file-${doc.type}`}
                      className={`flex items-center justify-center w-full p-3 border border-gray-300 rounded-lg transition-colors ${ds?.status === 'uploading'
                        ? 'cursor-not-allowed bg-gray-100'
                        : 'cursor-pointer hover:bg-gray-50'
                        }`}
                    >
                      {ds?.status === 'uploading' ? (
                        <><Loader2 className="w-4 h-4 mr-2 text-blue-500 animate-spin" /><span className="text-sm text-blue-600">Uploading...</span></>
                      ) : ds?.status === 'done' ? (
                        <><CheckCircle className="w-4 h-4 mr-2 text-green-500" /><span className="text-sm text-green-700 truncate max-w-xs">{ds.fileName}</span></>
                      ) : ds?.status === 'error' ? (
                        <><XCircle className="w-4 h-4 mr-2 text-red-500" /><span className="text-sm text-red-600">Failed — click to retry</span></>
                      ) : (
                        <><Upload className="w-4 h-4 mr-2 text-gray-400" /><span className="text-sm text-gray-600">Choose {doc.label}</span></>
                      )}
                    </label>

                    {ds?.status === 'error' && ds.error && (
                      <p className="text-xs text-red-500 mt-1">{ds.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg shadow-md hover:shadow-lg"
              suppressHydrationWarning
            >
              {isSubmitting ? "Saving..." : profile ? "Update Profile" : "Complete Profile & Find Scholarships"}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Your profile information and uploaded documents will be automatically saved.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}