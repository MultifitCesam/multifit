import { useEffect, useRef, useState } from "react";
import { SafeImg, SafeVideo } from "@/components/SafeMedia";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Plus, ImagePlus, Repeat2, Share2, X, Loader2, Trash2, Flag, MoreHorizontal, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StoriesBar from "@/components/StoriesBar";
import { FeedSkeleton } from "@/components/PremiumSkeletons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ProfileLite {
  user_id: string;
  username?: string;
  name: string;
  avatar_url: string | null;
}

interface PostRow {
  id: string;
  user_id: string;
  caption: string;
  media_url: string | null;
  media_type: "image" | "video" | "none";
  original_post_id: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
}

interface FeedPost extends PostRow {
  author?: ProfileLite;
  original?: (PostRow & { author?: ProfileLite }) | null;
  liked?: boolean;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: ProfileLite;
}

const MAX_FILE_MB = 25;

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFeed();
  }, [user?.id]);

  async function loadFeed() {
    setLoading(true);
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Erro ao carregar feed");
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(postsData?.map((p) => p.user_id) ?? []));
    const originalIds = Array.from(
      new Set(postsData?.filter((p) => p.original_post_id).map((p) => p.original_post_id!) ?? [])
    );

    const [{ data: profilesData }, { data: originalsData }, likedSet] = await Promise.all([
      supabase.from("profiles").select("user_id, name, avatar_url, username").in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      originalIds.length
        ? supabase.from("posts").select("*").in("id", originalIds)
        : Promise.resolve({ data: [] as PostRow[] }),
      user
        ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postsData?.map((p) => p.id) ?? [])
        : Promise.resolve({ data: [] as { post_id: string }[] }),
    ]);

    const profileMap = new Map((profilesData ?? []).map((p) => [p.user_id, p as ProfileLite]));

    // load original authors too
    const originalAuthorIds = Array.from(new Set((originalsData ?? []).map((o: any) => o.user_id)));
    const missing = originalAuthorIds.filter((id) => !profileMap.has(id));
    if (missing.length) {
      const { data: extra } = await supabase.from("profiles").select("user_id, name, avatar_url, username").in("user_id", missing);
      (extra ?? []).forEach((p) => profileMap.set(p.user_id, p as ProfileLite));
    }

    const originalMap = new Map(((originalsData as PostRow[]) ?? []).map((p) => [p.id, p]));
    const likedIds = new Set((likedSet.data ?? []).map((l: any) => l.post_id));

    const feed: FeedPost[] = (postsData ?? []).map((p) => ({
      ...(p as PostRow),
      author: profileMap.get(p.user_id),
      liked: likedIds.has(p.id),
      original: p.original_post_id
        ? (() => {
            const orig = originalMap.get(p.original_post_id!);
            return orig ? { ...orig, author: profileMap.get(orig.user_id) } : null;
          })()
        : null,
    }));

    setPosts(feed);
    setLoading(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande (máx ${MAX_FILE_MB}MB)`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function clearComposer() {
    setCaption("");
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setComposerOpen(false);
  }

  async function publish() {
    if (!user) {
      toast.error("Faça login para publicar");
      return;
    }
    if (!caption.trim() && !file) {
      toast.error("Escreva algo ou adicione mídia");
      return;
    }
    setUploading(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | "none" = "none";
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("community-media").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("community-media").getPublicUrl(path);
        media_url = data.publicUrl;
        media_type = file.type.startsWith("video") ? "video" : "image";
      }

      const { error: insErr } = await supabase.from("posts").insert({
        user_id: user.id,
        caption: caption.trim(),
        media_url,
        media_type,
      });
      if (insErr) throw insErr;
      toast.success("Publicado!");
      clearComposer();
      loadFeed();
    } catch (err: any) {
      toast.error(err.message || "Erro ao publicar");
    } finally {
      setUploading(false);
    }
  }

  async function toggleLike(post: FeedPost) {
    if (!user) {
      toast.error("Faça login para curtir");
      return;
    }
    // optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked: !p.liked, likes_count: p.likes_count + (p.liked ? -1 : 1) } : p
      )
    );
    
    // Add haptic-like animation to button
    const btn = document.querySelector(`#post-${post.id} .like-btn`);
    if (btn) {
      btn.classList.add("scale-125");
      setTimeout(() => btn.classList.remove("scale-125"), 200);
    }

    if (post.liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      if (error && !error.message.includes("duplicate")) {
        toast.error("Erro ao curtir");
      }
    }
  }

  async function repost(post: FeedPost) {
    if (!user) {
      toast.error("Faça login para repostar");
      return;
    }
    const target = post.original ?? post;
    
    // Optimistic UI or feedback
    toast.success("Repostando...");
    
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      caption: "",
      media_url: target.media_url,
      media_type: target.media_type,
      original_post_id: target.id,
    });
    if (error) {
      toast.error("Erro ao repostar");
      return;
    }
    toast.success("Compartilhado no seu feed! 🔄");
    loadFeed();
  }

  async function share(post: FeedPost) {
    const url = `${window.location.origin}/community#post-${post.id}`;
    const text = post.caption || "Veja este post no MultiFit";
    try {
      if (navigator.share) {
        await navigator.share({ title: "MultiFit", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      // user cancelled
    }
  }

  async function openComments(postId: string) {
    setActiveComments(postId);
    setCommentLoading(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, name, avatar_url, username").in("user_id", ids)
      : { data: [] as ProfileLite[] };
    const map = new Map((profs ?? []).map((p) => [p.user_id, p as ProfileLite]));
    setComments(((data ?? []) as CommentRow[]).map((c) => ({ ...c, author: map.get(c.user_id) })));
    setCommentLoading(false);
  }

  async function postComment() {
    if (!user || !activeComments || !commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    
    // Animation trigger for input
    const input = document.querySelector("#comment-input");
    if (input) {
      input.classList.add("translate-y-[-4px]");
      setTimeout(() => input.classList.remove("translate-y-[-4px]"), 200);
    }

    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: activeComments, user_id: user.id, content: text });
    if (error) {
      toast.error("Erro ao comentar");
      setCommentText(text);
      return;
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === activeComments ? { ...p, comments_count: p.comments_count + 1 } : p))
    );
    openComments(activeComments);
  }

  async function deleteComment(id: string) {
    if (!activeComments) return;
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    setComments((prev) => prev.filter((c) => c.id !== id));
    setPosts((prev) =>
      prev.map((p) => (p.id === activeComments ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p))
    );
  }

  async function deletePost(id: string) {
    if (!confirm("Excluir este post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post excluído");
  }

  async function submitReport() {
    if (!user || !reportPostId) return;
    setReporting(true);
    const { error } = await supabase.from("post_reports").insert({
      post_id: reportPostId,
      user_id: user.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    });
    setReporting(false);
    if (error) {
      if (error.code === "23505") toast.error("Você já denunciou este post");
      else toast.error("Erro ao denunciar");
      return;
    }
    toast.success("Denúncia enviada. Obrigado!");
    setReportPostId(null);
    setReportReason("Spam");
    setReportDetails("");
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 max-w-lg mx-auto bg-background">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium text-foreground">Comunidade</h1>
        <button
          onClick={() => setComposerOpen(true)}
          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
          aria-label="Nova postagem"
        >
          <Plus size={18} />
        </button>
      </div>

      <StoriesBar />

      {loading && (
        <FeedSkeleton />
      )}

      {!loading && posts.length === 0 && (
        <div className="bg-secondary border border-border/50 rounded-[20px] p-10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <Users size={32} className="text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-base font-medium text-foreground mb-2">Feed vazio</h3>
            <p className="text-[13px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
              Ainda não há nada por aqui. Seja o primeiro a inspirar a comunidade! 💪
            </p>
          </div>
        </div>
      )}


      <div className="space-y-4">
        {posts.map((post, i) => {
          const display = post.original ?? post;
          const isRepost = !!post.original;
          return (
            <motion.article
              id={`post-${post.id}`}
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="bg-secondary border border-border/50 rounded-[20px] overflow-hidden mb-4"
            >

              {isRepost && (
                <div className="px-4 pt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Repeat2 size={12} />
                  <span>{post.author?.name || "Alguém"} repostou</span>
                </div>
              )}
              <header className="flex items-center gap-3 p-4 pb-3">
                <button
                  onClick={() => display.author?.username && navigate(`/u/${display.author.username}`)}
                  className="shrink-0"
                >
                  <Avatar profile={display.author} />
                </button>
                <button
                  onClick={() => display.author?.username && navigate(`/u/${display.author.username}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-foreground truncate">{display.author?.name || "Usuário"}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {display.author?.username ? `@${display.author.username} • ` : ""}
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>

                </button>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    aria-label="Mais opções"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === post.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 z-40 glass rounded-xl py-1 min-w-[140px] shadow-xl">
                        {post.user_id === user?.id ? (
                          <button
                            onClick={() => { setMenuOpen(null); deletePost(post.id); }}
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-destructive hover:bg-secondary/60"
                          >
                            <Trash2 size={12} /> Excluir
                          </button>
                        ) : (
                          <button
                            onClick={() => { setMenuOpen(null); setReportPostId(post.id); }}
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-secondary/60"
                          >
                            <Flag size={12} /> Denunciar
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </header>

              {display.media_url && display.media_type === "image" && (
                <SafeImg src={display.media_url} alt="" className="w-full max-h-[520px] object-cover bg-secondary" loading="lazy" />
              )}
              {display.media_url && display.media_type === "video" && (
                <SafeVideo src={display.media_url} controls playsInline className="w-full max-h-[520px] bg-black" />
              )}

              {display.caption && (
                <p className="text-[13px] leading-relaxed px-4 pt-3 text-foreground font-normal">
                  <span className="font-semibold mr-2">{display.author?.name}</span>
                  {display.caption}
                </p>
              )}


              <div className="flex items-center gap-5 px-4 py-4">
                <ActionBtn 
                  onClick={() => toggleLike(post)} 
                  active={post.liked} 
                  activeClass="text-[hsl(var(--destructive))]"
                  className="transition-transform duration-200"
                >
                  <motion.span
                    key={String(post.liked)}
                    initial={{ scale: 1 }}
                    animate={post.liked ? { scale: [1, 1.3, 0.95, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <Heart size={20} className={post.liked ? "fill-destructive text-destructive" : "text-muted-foreground"} />
                  </motion.span>
                  <span className="text-[12px] font-medium">{post.likes_count}</span>
                </ActionBtn>

                <ActionBtn onClick={() => openComments(post.id)} className="text-muted-foreground hover:text-foreground">
                  <MessageCircle size={20} />
                  <span className="text-[12px] font-medium">{post.comments_count}</span>
                </ActionBtn>
                
                <ActionBtn onClick={() => repost(post)} className="text-muted-foreground hover:text-foreground active:rotate-180 duration-500">
                  <Repeat2 size={20} />
                  <span className="text-[12px] font-medium">{post.reposts_count}</span>
                </ActionBtn>
                <ActionBtn onClick={() => share(post)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <Share2 size={20} />
                </ActionBtn>
              </div>

            </motion.article>
          );
        })}
      </div>

      {/* Composer */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={clearComposer}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-secondary border border-border/50 rounded-[20px] p-6"
            >

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Nova postagem</h2>
                <button onClick={clearComposer} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="O que você está treinando hoje?"
                rows={3}
                maxLength={500}
                className="w-full bg-background border border-border/50 rounded-[14px] p-4 text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              />


              {previewUrl && (
                <div className="relative mt-3">
                  {file?.type.startsWith("video") ? (
                    <video src={previewUrl} controls className="w-full max-h-72 rounded-xl bg-black" />
                  ) : (
                    <img src={previewUrl} alt="" className="w-full max-h-72 object-cover rounded-xl" />
                  )}
                  <button
                    onClick={() => {
                      setFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-background/70 rounded-full p-1.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFile}
                className="hidden"
              />

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-[12px] text-muted-foreground bg-background border border-border/50 px-4 py-2 rounded-xl hover:text-foreground transition-all"
                >
                  <ImagePlus size={16} /> Foto / vídeo
                </button>
                <button
                  onClick={publish}
                  disabled={uploading}
                  className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publicar
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments */}
      <AnimatePresence>
        {activeComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => setActiveComments(null)}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-secondary border-t border-x border-border/50 rounded-t-[24px] sm:rounded-[24px] sm:border flex flex-col max-h-[85vh]"
            >

              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <h2 className="text-base font-medium text-foreground">Comentários</h2>
                <button onClick={() => setActiveComments(null)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {commentLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                )}
                {!commentLoading && comments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-6">Seja o primeiro a comentar.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar profile={c.author} size={32} />
                    <div className="flex-1">
                      <div className="bg-background border border-border/50 rounded-[14px] px-3 py-2">
                        <p className="text-[12px] font-semibold text-foreground">{c.author?.name || "Usuário"}</p>
                        <p className="text-[13px] text-muted-foreground leading-relaxed break-words">{c.content}</p>
                      </div>

                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                        {c.user_id === user?.id && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-[10px] text-muted-foreground hover:text-destructive"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border/30 flex gap-3 bg-secondary rounded-b-[24px]">
                <input
                  id="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && postComment()}
                  placeholder={user ? "Adicione um comentário..." : "Faça login para comentar"}
                  disabled={!user}
                  maxLength={500}
                  className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={postComment}
                  disabled={!user || !commentText.trim()}
                  className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 active:scale-95 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {reportPostId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setReportPostId(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-secondary border border-border/50 rounded-[24px] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <Flag size={20} className="text-destructive" />
                <h2 className="text-base font-medium text-foreground">Denunciar publicação</h2>
              </div>

              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 px-1 block tracking-tight">Motivo</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-[14px] px-3 py-3.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >

                <option>Spam</option>
                <option>Conteúdo inadequado</option>
                <option>Discurso de ódio</option>
                <option>Assédio ou bullying</option>
                <option>Informação falsa</option>
                <option>Violência</option>
                <option>Outro</option>
              </select>
              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 px-1 block tracking-tight">Detalhes (opcional)</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Conte mais sobre o problema..."
                className="w-full bg-background border border-border/50 rounded-[14px] px-3 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 mb-6"
              />

              <div className="flex gap-2">
                <button onClick={() => setReportPostId(null)} className="flex-1 bg-background border border-border/50 py-4 rounded-[14px] text-sm font-medium">
                  Cancelar
                </button>
                <button
                  onClick={submitReport}
                  disabled={reporting}
                  className="flex-1 bg-destructive text-destructive-foreground py-4 rounded-[14px] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {reporting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                  Enviar
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  active,
  activeClass,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 transition-all active:scale-[0.98] ${
        active ? activeClass : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >

      {children}
    </button>
  );
}

function Avatar({ profile, size = 40 }: { profile?: ProfileLite; size?: number }) {
  const initial = (profile?.name || "?").charAt(0).toUpperCase();
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-secondary shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0"
    >
      {initial}
    </div>
  );
}
