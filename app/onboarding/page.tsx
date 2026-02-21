"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveUserProfile } from "@/actions/user";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function OnboardingPage() 
{
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [docType]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Add uploaded files to formData
    Object.entries(uploadedFiles).forEach(([docType, file]) => {
      if (file) {
        formData.append(`document_${docType}`, file);
      }
    });

    try {
      await saveUserProfile(formData);
      router.push("/");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-lg text-gray-600">
            Help us find the best scholarships tailored just for you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-blue-900">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth <span className="text-red-500">*</span></label>
                <input
                  name="dateOfBirth"
                  type="date"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender <span className="text-red-500">*</span></label>
                <select
                  name="gender"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="e.g., Indian"
                  defaultValue="Indian"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="e.g., B.Tech CSE"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">University/Institution <span className="text-red-500">*</span></label>
                <input
                  name="university"
                  type="text"
                  placeholder="e.g., IIT Delhi"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expected Graduation Year <span className="text-red-500">*</span></label>
                <input
                  name="graduationYear"
                  type="number"
                  min="2024"
                  max="2030"
                  placeholder="e.g., 2025"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="e.g., 7.5"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="e.g., India"
                  defaultValue="India"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">State/Province <span className="text-red-500">*</span></label>
                <input
                  name="state"
                  type="text"
                  placeholder="e.g., Maharashtra"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="e.g., 400000"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category <span className="text-red-500">*</span></label>
                <select
                  name="category"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">I have a disability (PwD)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  name="firstGeneration"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
              ].map((doc) => (
                <div key={doc.type} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium">{doc.label}</span>
                      {doc.required && <span className="text-red-500">*</span>}
                    </label>
                    {uploadedFiles[doc.type] && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, doc.type)}
                    className="hidden"
                    id={`file-${doc.type}`}
                  />
                  
                  <label
                    htmlFor={`file-${doc.type}`}
                    className="flex items-center justify-center w-full p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadedFiles[doc.type] ? uploadedFiles[doc.type]?.name : `Choose ${doc.label}`}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {isSubmitting ? "Processing..." : "Complete Profile & Find Scholarships"}
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