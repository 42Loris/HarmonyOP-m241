// app/app/profiles/[id]/page.tsx
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { roleProfiles } from "@/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
// Added Trash2 to the imports!
import { ArrowLeft, Plus, Laptop, Users, GraduationCap, ClipboardList, Calendar, Trash2 } from "lucide-react";
import { addProfileTaskAction, deleteProfileTaskAction } from "@/actions/profile-tasks";
import { addProfileMeetingAction, deleteProfileMeetingAction } from "@/actions/profile-meetings";

export default async function ProfileDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await db.query.roleProfiles.findFirst({
    where: eq(roleProfiles.id, id),
    with: {
      defaultTasks: true,
      defaultMeetings: true, 
    },
  });

  if (!profile) redirect("/app/profiles");

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "IT_ACCESS": return <Laptop className="h-4 w-4 text-blue-500" />;
      case "HARDWARE": return <Laptop className="h-4 w-4 text-purple-500" />;
      case "HR_ADMIN": return <Users className="h-4 w-4 text-pink-500" />;
      case "TRAINING": return <GraduationCap className="h-4 w-4 text-orange-500" />;
      default: return <ClipboardList className="h-4 w-4 text-slate-500" />;
    }
  };

  const handleAddTask = async (formData: FormData) => {
    "use server";
    await addProfileTaskAction(formData);
  };

  const handleAddMeeting = async (formData: FormData) => {
    "use server";
    await addProfileMeetingAction(formData);
  };

  const handleDeleteTask = async (formData: FormData) => {
    "use server";
    await deleteProfileTaskAction(formData);
  };

  const handleDeleteMeeting = async (formData: FormData) => {
    "use server";
    await deleteProfileMeetingAction(formData);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/app/profiles" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Profiles
        </Link>
      </div>

      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Department: {profile.department}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Lists */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Tasks List */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Default Onboarding Tasks</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {profile.defaultTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No tasks added yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {profile.defaultTasks.map(task => (
                    <li key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-md">{getTaskIcon(task.taskType)}</div>
                        <span className="font-medium text-slate-700">{task.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {task.taskType.replace("_", " ")}
                        </span>
                        {/* Delete Task Form */}
                        <form action={handleDeleteTask}>
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="profileId" value={profile.id} />
                          <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Meetings List */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Auto-Scheduled Meetings</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {profile.defaultMeetings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No meetings scheduled. Add one on the right.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {profile.defaultMeetings.map(meeting => (
                    <li key={meeting.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-md"><Calendar className="h-4 w-4 text-blue-600" /></div>
                        <div>
                          <p className="font-medium text-slate-700">{meeting.title}</p>
                          <p className="text-xs text-slate-500">With: {meeting.hostEmail} • {meeting.durationMinutes} mins</p>
                        </div>
                      </div>

                      {/* Delete Meeting Form */}
                      <form action={handleDeleteMeeting}>
                        <input type="hidden" name="id" value={meeting.id} />
                        <input type="hidden" name="profileId" value={profile.id} />
                        <button type="submit" className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Forms */}
        <div className="space-y-6">
          
          {/* Add Task Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Task
            </h3>
            <form action={handleAddTask} className="space-y-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
                <input type="text" name="title" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select name="taskType" required className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="IT_ACCESS">IT Access (Software)</option>
                  <option value="HARDWARE">Hardware (Equipment)</option>
                  <option value="HR_ADMIN">HR & Admin</option>
                  <option value="TRAINING">Training</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-md text-sm font-medium">Save Task</button>
            </form>
          </div>

          {/* Add Meeting Form */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Schedule Meeting
            </h3>
            <form action={handleAddMeeting} className="space-y-4">
              <input type="hidden" name="profileId" value={profile.id} />
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-1">Meeting Title</label>
                <input type="text" name="title" required placeholder="e.g. Codebase Intro" className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-1">Host Email (Who leads it?)</label>
                <input type="email" name="hostEmail" required placeholder="lead.dev@company.com" className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-900 mb-1">Duration (Minutes)</label>
                <select name="durationMinutes" className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm bg-white">
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium">Add Meeting to Template</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}