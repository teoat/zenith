import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

// Define the form schema using Zod
const fraudCaseSchema = z.object({
  caseTitle: z.string().min(5, "Title must be at least 5 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(20, "Please provide a detailed description"),
  occurrenceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

type FraudCaseFormValues = z.infer<typeof fraudCaseSchema>;

export const ExampleFraudCaseForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FraudCaseFormValues>({
    resolver: zodResolver(fraudCaseSchema),
    defaultValues: {
      severity: "MEDIUM",
      occurrenceDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = async (data: FraudCaseFormValues) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Fraud Case Created Successfully!", {
        description: `Case: ${data.caseTitle} - Severity: ${data.severity}`,
      });

      reset();
    } catch {
      toast.error("Failed to create case. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900">
        Create New Fraud Case
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Case Title
          </label>
          <input
            {...register("caseTitle")}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-slate-50 border ${errors.caseTitle ? "border-red-500" : ""}`}
            placeholder="Suspicious Transaction Group A"
          />
          {errors.caseTitle && (
            <span className="text-red-500 text-xs">
              {errors.caseTitle.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Severity
          </label>
          <select
            {...register("severity")}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-slate-50 border"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Occurrence Date
          </label>
          <input
            type="date"
            {...register("occurrenceDate")}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-slate-50 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-slate-50 border ${errors.description ? "border-red-500" : ""}`}
            placeholder="Provide all known details about the suspicious activity..."
          />
          {errors.description && (
            <span className="text-red-500 text-xs">
              {errors.description.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Processing..." : "Submit Case"}
        </button>
      </form>
    </div>
  );
};
