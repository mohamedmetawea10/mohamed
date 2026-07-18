import React, { useState } from 'react';
import { DatabaseState, Post, UserSession } from '../types';
import { PlusCircle, Edit2, Trash2, Calendar, Phone, Mail, Image as ImageIcon, X } from 'lucide-react';

interface HomeViewProps {
  db: DatabaseState;
  session: UserSession;
  onUpdateDb: (updated: DatabaseState) => void;
  lang: 'ar' | 'en';
  translate: (key: string) => string;
}

export default function HomeView({
  db,
  session,
  onUpdateDb,
  lang,
  translate
}: HomeViewProps) {
  const isAuthorized = session.role === 'admin' || session.role === 'teacher';

  const [posts, setPosts] = useState<Post[]>(db.posts || []);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Post Form State
  const [postId, setPostId] = useState<string | null>(null);
  const [postTitle, setPostIdTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | undefined>('');

  // Teacher Profile Edit Form State
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [teacherName, setTeacherName] = useState(db.siteSettings.teacherName);
  const [teacherTitle, setTeacherTitle] = useState(db.siteSettings.teacherTitle);
  const [teacherBio, setTeacherBio] = useState(db.siteSettings.teacherBio);
  const [teacherPhone, setTeacherPhone] = useState(db.siteSettings.teacherPhone);
  const [teacherEmail, setTeacherEmail] = useState(db.siteSettings.teacherEmail);

  const handleOpenAddPost = () => {
    setPostId(null);
    setPostIdTitle('');
    setPostContent('');
    setPostImage('');
    setModalOpen(true);
  };

  const handleOpenEditPost = (post: Post) => {
    setPostId(post.id);
    setPostIdTitle(post.title);
    setPostContent(post.content);
    setPostImage(post.image || '');
    setModalOpen(true);
  };

  const handleDeletePost = (id: string) => {
    const confirmation = window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المنشور نهائياً؟' : 'Are you sure you want to delete this post?');
    if (!confirmation) return;

    const updatedPosts = posts.filter(p => p.id !== id);
    setPosts(updatedPosts);
    const updatedDb = { ...db, posts: updatedPosts };
    onUpdateDb(updatedDb);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      alert(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    let updatedPosts = [...posts];

    if (postId) {
      // Edit mode
      updatedPosts = updatedPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            title: postTitle,
            content: postContent,
            image: postImage
          };
        }
        return p;
      });
    } else {
      // Add mode
      const newPost: Post = {
        id: 'post_' + Date.now(),
        title: postTitle,
        content: postContent,
        date: new Date().toISOString().substring(0, 10),
        image: postImage
      };
      updatedPosts = [newPost, ...updatedPosts];
    }

    setPosts(updatedPosts);
    const updatedDb = { ...db, posts: updatedPosts };
    onUpdateDb(updatedDb);
    setModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPostImage(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = {
      ...db,
      siteSettings: {
        ...db.siteSettings,
        teacherName,
        teacherTitle,
        teacherBio,
        teacherPhone,
        teacherEmail
      }
    };
    onUpdateDb(updatedDb);
    setBioModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {lang === 'ar' ? db.siteSettings.centerNameAr : db.siteSettings.centerNameEn}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar' ? `المنصة التعليمية للرياضيات - ${db.siteSettings.teacherName}` : `Mathematics Portal - ${db.siteSettings.teacherName}`}
          </p>
        </div>
        {isAuthorized && (
          <button
            onClick={handleOpenAddPost}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة منشور' : 'Add Announcement'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Latest Announcements Feed */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <span>📢</span>
              <span>{lang === 'ar' ? 'أحدث الإعلانات والبوستات' : 'Latest Announcements'}</span>
            </h3>

            {posts.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 font-medium">
                {lang === 'ar' ? 'لا يوجد منشورات حالياً' : 'No announcements published yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="border border-slate-100 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/30 dark:bg-slate-950/20 space-y-4 relative group hover:border-purple-200 dark:hover:border-purple-950/40 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{post.date}</span>
                        </div>
                      </div>

                      {/* Edit controls for Admin/Teacher */}
                      {isAuthorized && (
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            className="p-1.5 text-slate-600 hover:text-purple-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                            title={lang === 'ar' ? 'تعديل المنشور' : 'Edit Post'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-500 dark:text-slate-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 rounded"
                            title={lang === 'ar' ? 'حذف المنشور' : 'Delete Post'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>

                    {post.image && (
                      <div className="w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-center items-center">
                        <img 
                          src={post.image} 
                          alt="Post Attachment" 
                          className="w-full max-h-[350px] object-contain block"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: About the Teacher and Contacts */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-emerald-500 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <span>👤</span>
              <span>{lang === 'ar' ? 'عن المعلم والمنصة' : 'About the Teacher'}</span>
            </h3>

            <div className="text-center py-4 space-y-3">
              <div className="relative w-28 h-24 mx-auto border-2 border-white dark:border-slate-800 bg-white rounded-lg shadow-md rotate-[-3deg]">
                <img 
                  src={db.siteSettings.teacherAvatar || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80"} 
                  alt="Teacher portrait" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                  {db.siteSettings.teacherName}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {db.siteSettings.teacherTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify mt-1">
              {db.siteSettings.teacherBio}
            </p>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="font-semibold">{lang === 'ar' ? 'رقم التواصل:' : 'Phone:'}</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{db.siteSettings.teacherPhone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-semibold">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                <span className="font-mono truncate">{db.siteSettings.teacherEmail}</span>
              </div>
            </div>

            {isAuthorized && (
              <button
                onClick={() => setBioModalOpen(true)}
                className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-5 shadow-sm transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تعديل بيانات المدرس' : 'Edit Biography'}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD/EDIT POST */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[500px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-zoomIn">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {postId ? (lang === 'ar' ? 'تعديل المنشور' : 'Edit Post') : (lang === 'ar' ? 'إضافة منشور جديد' : 'Publish Announcement')}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 rounded p-1 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost}>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'عنوان المنشور' : 'Post Title'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={postTitle}
                    onChange={(e) => setPostIdTitle(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: هام لطلاب الصف الثالث الإعدادي' : 'e.g. Schedule Update'}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'محتوى المنشور' : 'Post Body Content'}
                  </label>
                  <textarea 
                    required 
                    rows={4}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب تفاصيل الإعلان أو المنشور هنا...' : 'Write announcement body details here...'}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'صورة المنشور (اختياري)' : 'Upload Attachment Image (Optional)'}
                  </label>
                  <label 
                    htmlFor="post-image-file" 
                    className="w-full border border-dashed border-purple-300 dark:border-purple-900 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-all text-purple-600 dark:text-purple-400 font-bold"
                  >
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-[11px]">{lang === 'ar' ? 'اختر صورة من جهازك' : 'Choose an image from file explorer'}</span>
                  </label>
                  <input 
                    type="file" 
                    id="post-image-file" 
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  {postImage && (
                    <div className="mt-3 relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-2 bg-slate-50 dark:bg-slate-950">
                      <img 
                        src={postImage} 
                        alt="Preview" 
                        className="max-h-24 mx-auto object-contain block rounded"
                      />
                      <button 
                        type="button" 
                        onClick={() => setPostImage('')}
                        className="absolute top-2 right-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 p-1.5 rounded-full text-xs shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all"
                >
                  {lang === 'ar' ? 'نشر' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TEACHER BRAND BIOGRAPHY */}
      {bioModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[500px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-zoomIn">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                {lang === 'ar' ? 'تعديل بيانات المعلم والمنصة' : 'Edit Biography Settings'}
              </h3>
              <button 
                onClick={() => setBioModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 rounded p-1 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBio}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'اسم المعلم' : 'Teacher Name'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'المسمى الوظيفي' : 'Teacher Title'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={teacherTitle}
                    onChange={(e) => setTeacherTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'النبذة التعريفية' : 'Biography text'}
                  </label>
                  <textarea 
                    required 
                    rows={4}
                    value={teacherBio}
                    onChange={(e) => setTeacherBio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'رقم هاتف التواصل' : 'Contact Phone'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setBioModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/10 transition-all"
                >
                  {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
