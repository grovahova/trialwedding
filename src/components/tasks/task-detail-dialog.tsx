"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Send, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/constants";
import { formatDate, initials, whatsappLink } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { Task, TaskPriority, TaskStatus, Profile } from "@/lib/types";

export function TaskDetailDialog({
  task,
  members,
  canEdit,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  task: Task;
  members: Profile[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    return members
      .filter((m) => m.full_name.toLowerCase().includes(mentionQuery.toLowerCase()))
      .slice(0, 5);
  }, [mentionQuery, members]);

  function handleCommentChange(value: string) {
    setNewComment(value);
    const match = value.match(/@([a-zA-Z ]{0,24})$/);
    setMentionQuery(match ? match[1] : null);
  }

  function insertMention(member: Profile) {
    const withoutPartial = newComment.replace(/@([a-zA-Z ]{0,24})$/, "");
    setNewComment(`${withoutPartial}@${member.full_name} `);
    setMentionedIds((prev) => Array.from(new Set([...prev, member.id])));
    setMentionQuery(null);
    commentInputRef.current?.focus();
  }

  function resolveMentions(text: string): string[] {
    const found = members.filter((m) => text.includes(`@${m.full_name}`)).map((m) => m.id);
    return Array.from(new Set([...mentionedIds, ...found]));
  }

  function renderCommentBody(body: string) {
    const parts = body.split(/(@[A-Za-z ]+)/g);
    return parts.map((part, i) => {
      const isMention = part.startsWith("@") && members.some((m) => part === `@${m.full_name}`);
      return isMention ? (
        <span key={i} className="font-medium text-emerald-700 dark:text-emerald-400">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  }

  async function refetch() {
    const { data } = await supabase
      .from("tasks")
      .select(
        `*, event:events(id, name, color_theme),
         assignees:task_assignees(profile:profiles(*)),
         checklist:task_checklist_items(*),
         comments:task_comments(*, profile:profiles(id, full_name, avatar_url))`
      )
      .eq("id", task.id)
      .single();
    if (data) {
      const normalized: Task = {
        ...(data as any),
        assignees: (data as any).assignees?.map((a: any) => a.profile) ?? [],
      };
      onUpdated(normalized);
    }
  }

  async function updateField(fields: Partial<Task>) {
    setSaving(true);
    const { error } = await supabase.from("tasks").update(fields).eq("id", task.id);
    setSaving(false);
    if (error) {
      toast.error("Update failed");
      return;
    }
    if (fields.status === "completed") {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ["#187d5c", "#dba93a"] });
    }
    await refetch();
  }

  async function addChecklistItem() {
    if (!newChecklistItem.trim()) return;
    const { error } = await supabase.from("task_checklist_items").insert({
      task_id: task.id,
      label: newChecklistItem,
      position: task.checklist?.length ?? 0,
    });
    if (error) return toast.error("Could not add item");
    setNewChecklistItem("");
    await refetch();
  }

  async function toggleChecklistItem(id: string, is_done: boolean) {
    await supabase.from("task_checklist_items").update({ is_done }).eq("id", id);
    const total = task.checklist?.length ?? 0;
    const done = (task.checklist ?? []).filter((c) => (c.id === id ? is_done : c.is_done)).length;
    if (total > 0) {
      await supabase.from("tasks").update({ completion_percent: Math.round((done / total) * 100) }).eq("id", task.id);
    }
    await refetch();
  }

  async function removeChecklistItem(id: string) {
    await supabase.from("task_checklist_items").delete().eq("id", id);
    await refetch();
  }

  async function toggleAssignee(profileId: string) {
    const isAssigned = task.assignees?.some((a) => a.id === profileId);
    if (isAssigned) {
      await supabase.from("task_assignees").delete().eq("task_id", task.id).eq("profile_id", profileId);
    } else {
      await supabase.from("task_assignees").insert({ task_id: task.id, profile_id: profileId });
    }
    await refetch();
  }

  async function postComment() {
    if (!newComment.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("task_comments").insert({
      task_id: task.id,
      profile_id: user?.id,
      body: newComment,
      mentioned_profile_ids: resolveMentions(newComment),
    });
    if (error) return toast.error("Could not post comment");
    setNewComment("");
    setMentionedIds([]);
    setMentionQuery(null);
    await refetch();
  }

  async function deleteTask() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) return toast.error("Could not delete task");
    toast.success("Task deleted");
    onDeleted(task.id);
  }

  const checklistDone = (task.checklist ?? []).filter((c) => c.is_done).length;
  const checklistTotal = task.checklist?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={PRIORITY_STYLES[task.priority].badge} variant="outline">
              {PRIORITY_STYLES[task.priority].label}
            </Badge>
            <Badge className={STATUS_STYLES[task.status].badge} variant="outline">
              {STATUS_STYLES[task.status].label}
            </Badge>
            {task.event && <Badge variant="outline">{task.event.name}</Badge>}
          </div>
          <DialogTitle>{task.name}</DialogTitle>
          {task.description && <DialogDescription>{task.description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={task.status}
              disabled={!canEdit || saving}
              onValueChange={(v) => updateField({ status: v as TaskStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_STYLES).map(([value, s]) => (
                  <SelectItem key={value} value={value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select
              value={task.priority}
              disabled={!canEdit || saving}
              onValueChange={(v) => updateField({ priority: v as TaskPriority })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_STYLES).map(([value, s]) => (
                  <SelectItem key={value} value={value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {task.due_date && (
          <p className="text-sm text-muted-foreground">Due {formatDate(task.due_date, "EEEE, d MMMM yyyy")}</p>
        )}

        <div className="flex flex-col gap-2">
          <Label>Assigned to</Label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = task.assignees?.some((a) => a.id === m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleAssignee(m.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                    active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px]">{initials(m.full_name)}</AvatarFallback>
                  </Avatar>
                  {m.full_name}
                  {active && m.phone && (
                    <a
                      href={whatsappLink(m.phone, `Hi ${m.full_name}, following up on "${task.name}"`)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-600 hover:underline"
                    >
                      WA
                    </a>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Checklist</Label>
            {checklistTotal > 0 && (
              <span className="text-xs text-muted-foreground">
                {checklistDone}/{checklistTotal} done
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {(task.checklist ?? []).map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                <Checkbox
                  checked={item.is_done}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                />
                <span className={`flex-1 text-sm ${item.is_done ? "text-muted-foreground line-through" : ""}`}>
                  {item.label}
                </span>
                {canEdit && (
                  <button onClick={() => removeChecklistItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Input
                placeholder="Add checklist item…"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklistItem())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addChecklistItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Comments
          </Label>
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto scrollbar-thin">
            {(task.comments ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-sm">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px]">
                    {c.profile?.full_name ? initials(c.profile.full_name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">{c.profile?.full_name ?? "Someone"}</span>{" "}
                  <span className="text-muted-foreground">{renderCommentBody(c.body)}</span>
                </div>
              </div>
            ))}
            {(task.comments?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">No comments yet — @mention someone to loop them in.</p>
            )}
          </div>
          <div className="relative flex gap-2">
            <Textarea
              ref={commentInputRef}
              placeholder="Write a comment… type @ to mention someone"
              className="min-h-[40px]"
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && mentionMatches.length === 0) {
                  e.preventDefault();
                  postComment();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={postComment}>
              <Send className="h-4 w-4" />
            </Button>
            {mentionMatches.length > 0 && (
              <div className="absolute bottom-full left-0 z-10 mb-1 w-56 overflow-hidden rounded-md border border-border bg-card shadow-soft-lg">
                {mentionMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => insertMention(m)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{initials(m.full_name)}</AvatarFallback>
                    </Avatar>
                    {m.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          {canEdit ? (
            <Button variant="ghost" className="text-destructive" onClick={deleteTask}>
              <Trash2 className="h-4 w-4" /> Delete task
            </Button>
          ) : (
            <span />
          )}
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
