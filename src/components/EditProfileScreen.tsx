import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Camera, Loader2, CheckCircle, User as UserIcon } from 'lucide-react';
import { updateProfile, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EditProfileScreenProps {
  user: User;
  onBack: () => void;
  isDarkMode: boolean;
}

export default function EditProfileScreen({ user, onBack, isDarkMode }: EditProfileScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load existing user info from Firestore
    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.profilePic) {
            setImagePreview(data.profilePic);
          } else if (user.photoURL) {
            setImagePreview(user.photoURL);
          }
        } else {
          // Fallback to auth displayName
          const [f, ...l] = (user.displayName || '').split(' ');
          setFirstName(f || '');
          setLastName(l.join(' ') || '');
          if (user.photoURL) {
            setImagePreview(user.photoURL);
          }
        }
      } catch (err) {
        console.error("Error loading user data", err);
      }
    };
    loadUserData();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Image size should be less than 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ text: 'First and last name are required', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const updateData: any = {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      };

      // Only update photoURL if preview is not too long to prevent auth object size limits,
      // but we will mainly rely on Firestore for displaying profile pic in the app.
      if (imagePreview && imagePreview.length < 500000) {
          updateData.photoURL = imagePreview;
      }

      // 1. Update Firebase Auth Profile
      await updateProfile(user, updateData);

      // 2. Update Firestore User Doc
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePic: imagePreview
      });

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      setTimeout(() => {
         onBack();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FAFAFA] text-black'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 shrink-0 border-b border-black/5 dark:border-white/5">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} className="text-black/70 dark:text-white/70" />
        </button>
        <h2 className="text-lg font-black tracking-tight">Edit Profile</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 hide-scrollbar flex flex-col items-center">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-black/5 dark:bg-white/5 border-[3px] border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-black/30 dark:text-white/30" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <Camera size={18} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-[10px] uppercase tracking-widest font-bold text-black/40 dark:text-white/40 mt-3 text-center">Tap icon to change</p>
          </div>

          {/* Form */}
          <div className="space-y-5 w-full max-w-sm mt-4">
             <div>
                <label className="text-[11px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-2 block">First Name</label>
                <input 
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-[16px] placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all shadow-inner"
                />
             </div>
             
             <div>
                <label className="text-[11px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-2 block">Last Name</label>
                <input 
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-black/10 dark:focus:border-white/10 rounded-2xl px-5 py-4 text-black dark:text-white font-bold text-[16px] placeholder:text-black/20 dark:placeholder:text-white/20 outline-none transition-all shadow-inner"
                />
             </div>
          </div>

          {message.text && (
             <div className={`mt-6 w-full max-w-sm p-4 rounded-2xl text-sm font-bold flex items-start gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {message.type === 'success' && <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                <span className="leading-snug">{message.text}</span>
             </div>
          )}

          <div className="mt-auto pt-8 pb-4 w-full max-w-sm">
            <button
               onClick={handleSave}
               disabled={loading}
               className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                 loading 
                 ? 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 cursor-not-allowed'
                 : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-xl'
               }`}
            >
               {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
            </button>
          </div>
      </div>
    </div>
  );
}
