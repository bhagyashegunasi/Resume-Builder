import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  FlatList,
  Dimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';


const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORAGE_KEY = '@resume_data_v2';

// ─── THEME SYSTEM ──────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg: '#F7F8FC',
    card: '#FFFFFF',
    text: '#1A1D2E',
    subtext: '#6B7280',
    accent: '#6C63FF',
    accentSoft: '#EEF0FF',
    border: '#E8EAF0',
    inputBg: '#F3F4F6',
    danger: '#FF5C6A',
    success: '#22C55E',
    gradStart: '#6C63FF',
    gradEnd: '#A78BFA',
    shadow: '#6C63FF22',
    tagBg: '#EEF0FF',
    tagText: '#6C63FF',
    sectionHeader: '#1A1D2E',
    fab: '#6C63FF',
    navBar: '#FFFFFF',
    navBarBorder: '#E8EAF0',
  },
  dark: {
    bg: '#0F1117',
    card: '#1C1F2E',
    text: '#F1F2F6',
    subtext: '#9CA3AF',
    accent: '#7C72FF',
    accentSoft: '#1E1B4B',
    border: '#2D3148',
    inputBg: '#252839',
    danger: '#FF5C6A',
    success: '#22C55E',
    gradStart: '#7C72FF',
    gradEnd: '#C084FC',
    shadow: '#00000050',
    tagBg: '#1E1B4B',
    tagText: '#A78BFA',
    sectionHeader: '#E2E8F0',
    fab: '#7C72FF',
    navBar: '#1C1F2E',
    navBarBorder: '#2D3148',
  },
};

// ─── TEMPLATES ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'simple', label: 'Simple', icon: '📄', color: '#6C63FF' },
  { id: 'modern', label: 'Modern', icon: '✨', color: '#0EA5E9' },
  { id: 'dark', label: 'Dark', icon: '🌑', color: '#1E293B' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: '#F97316' },
];

// ─── DEFAULT STATE ──────────────────────────────────────────────────────────────
const DEFAULT_RESUME = {
  name: '',
  email: '',
  phone: '',
  address: '',
  photo: null,
  photoBase64: null,
  objective: '',
  education: [{ id: Date.now(), degree: '', institution: '', year: '', grade: '' }],
  skills: [],
  internship: '',
  projects: [{ id: Date.now() + 1, title: '', description: '', tech: '' }],
  hobbies: '',
  selectedTemplate: 'modern',
};

// ─── UTILITY ───────────────────────────────────────────────────────────────────
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── PDF HTML GENERATORS ───────────────────────────────────────────────────────
const generateSimpleHTML = (data, imgSrc) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Georgia', serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
  .header { text-align: center; border-bottom: 2px solid #6C63FF; padding-bottom: 20px; margin-bottom: 24px; }
  .photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; border: 3px solid #6C63FF; }
  .name { font-size: 26px; font-weight: bold; color: #1a1a2e; letter-spacing: 1px; }
  .contact { font-size: 11px; color: #666; margin-top: 6px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 14px; font-weight: bold; color: #6C63FF; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 10px; }
  .entry { margin-bottom: 10px; }
  .entry-title { font-weight: bold; font-size: 13px; }
  .entry-sub { color: #555; font-size: 12px; }
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #f0eeff; color: #6C63FF; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  p { color: #444; font-size: 12px; }
</style></head><body>
<div class="header">
  ${imgSrc ? `<img class="photo" src="${imgSrc}" />` : ''}
  <div class="name">${data.name || 'Your Name'}</div>
  <div class="contact">${[data.email, data.phone, data.address].filter(Boolean).join(' · ')}</div>
</div>
${data.objective ? `<div class="section"><div class="section-title">Objective</div><p>${data.objective}</p></div>` : ''}
${data.education?.length ? `<div class="section"><div class="section-title">Education</div>${data.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution} ${e.year ? '· ' + e.year : ''} ${e.grade ? '· ' + e.grade : ''}</div></div>`).join('')}</div>` : ''}
${data.skills?.length ? `<div class="section"><div class="section-title">Skills</div><div class="skills-wrap">${data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}
${data.internship ? `<div class="section"><div class="section-title">Internship</div><p>${data.internship}</p></div>` : ''}
${data.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${data.projects.map(p => `<div class="entry"><div class="entry-title">${p.title}</div><div class="entry-sub">${p.tech}</div><p>${p.description}</p></div>`).join('')}</div>` : ''}
${data.hobbies ? `<div class="section"><div class="section-title">Hobbies</div><p>${data.hobbies}</p></div>` : ''}
</body></html>`;

const generateModernHTML = (data, imgSrc) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; font-size: 13px; line-height: 1.6; }
  .sidebar { width: 32%; background: linear-gradient(160deg, #6C63FF 0%, #A78BFA 100%); color: #fff; padding: 30px 20px; position: fixed; top:0; left:0; height: 100%; }
  .main { margin-left: 32%; padding: 30px 28px; }
  .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.6); margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto; }
  .s-name { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px; }
  .s-contact { font-size: 10px; opacity: 0.85; text-align: center; margin-bottom: 16px; line-height: 1.8; }
  .s-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin-top: 18px; margin-bottom: 6px; font-weight: bold; }
  .s-text { font-size: 11px; opacity: 0.9; }
  .skill-bar-label { font-size: 10px; opacity: 0.9; margin-bottom: 2px; }
  .skill-bar-bg { background: rgba(255,255,255,0.25); border-radius: 10px; height: 6px; margin-bottom: 7px; }
  .skill-bar-fill { background: #fff; border-radius: 10px; height: 6px; width: 80%; }
  .section-title { font-size: 15px; font-weight: bold; color: #6C63FF; letter-spacing: 0.5px; border-bottom: 2px solid #ede9fe; padding-bottom: 4px; margin-bottom: 12px; margin-top: 22px; }
  .section-title:first-child { margin-top: 0; }
  .entry { margin-bottom: 12px; }
  .entry-title { font-weight: bold; font-size: 13px; color: #1a1a2e; }
  .entry-sub { color: #7c3aed; font-size: 11px; font-weight: 600; }
  .entry-desc { color: #555; font-size: 12px; margin-top: 3px; }
  p { color: #444; font-size: 12px; }
</style></head><body>
<div class="sidebar">
  ${imgSrc ? `<img class="photo" src="${imgSrc}" />` : ''}
  <div class="s-name">${data.name || 'Your Name'}</div>
  <div class="s-contact">${[data.email, data.phone, data.address].filter(Boolean).join('\n')}</div>
  ${data.skills?.length ? `<div class="s-label">Skills</div>${data.skills.map(s => `<div class="skill-bar-label">${s}</div><div class="skill-bar-bg"><div class="skill-bar-fill"></div></div>`).join('')}` : ''}
  ${data.hobbies ? `<div class="s-label">Hobbies</div><div class="s-text">${data.hobbies}</div>` : ''}
</div>
<div class="main">
  ${data.objective ? `<div class="section-title">Profile</div><p>${data.objective}</p>` : ''}
  ${data.education?.length ? `<div class="section-title">Education</div>${data.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution}</div><div class="entry-desc">${[e.year, e.grade].filter(Boolean).join(' · ')}</div></div>`).join('')}` : ''}
  ${data.internship ? `<div class="section-title">Internship</div><p>${data.internship}</p>` : ''}
  ${data.projects?.length ? `<div class="section-title">Projects</div>${data.projects.map(p => `<div class="entry"><div class="entry-title">${p.title}</div><div class="entry-sub">${p.tech}</div><div class="entry-desc">${p.description}</div></div>`).join('')}` : ''}
</div>
</body></html>`;

const generateDarkHTML = (data, imgSrc) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; background: #0d1117; color: #c9d1d9; padding: 40px; font-size: 12px; line-height: 1.7; }
  .header { display: flex; align-items: center; gap: 24px; border-bottom: 1px solid #30363d; padding-bottom: 24px; margin-bottom: 28px; }
  .photo { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 2px solid #58a6ff; flex-shrink: 0; }
  .name { font-size: 28px; font-weight: bold; color: #e6edf3; letter-spacing: 2px; }
  .title-line { color: #58a6ff; font-size: 12px; margin-top: 4px; }
  .contact { color: #8b949e; font-size: 11px; margin-top: 6px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #58a6ff; margin-bottom: 10px; }
  .section-title::before { content: "// "; }
  .entry { border-left: 2px solid #21262d; padding-left: 14px; margin-bottom: 12px; }
  .entry-title { color: #e6edf3; font-weight: bold; }
  .entry-sub { color: #58a6ff; font-size: 11px; }
  .entry-desc { color: #8b949e; font-size: 11px; margin-top: 4px; }
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #161b22; color: #58a6ff; border: 1px solid #30363d; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-family: 'Courier New', monospace; }
  p { color: #8b949e; font-size: 12px; }
</style></head><body>
<div class="header">
  ${imgSrc ? `<img class="photo" src="${imgSrc}" />` : ''}
  <div>
    <div class="name">${data.name || 'Your Name'}</div>
    <div class="title-line">> Software Engineer</div>
    <div class="contact">${[data.email, data.phone, data.address].filter(Boolean).join(' | ')}</div>
  </div>
</div>
${data.objective ? `<div class="section"><div class="section-title">Objective</div><p>${data.objective}</p></div>` : ''}
${data.education?.length ? `<div class="section"><div class="section-title">Education</div>${data.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution} ${e.year ? '(' + e.year + ')' : ''}</div><div class="entry-desc">${e.grade}</div></div>`).join('')}</div>` : ''}
${data.skills?.length ? `<div class="section"><div class="section-title">Skills</div><div class="skills-wrap">${data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}
${data.internship ? `<div class="section"><div class="section-title">Internship</div><p>${data.internship}</p></div>` : ''}
${data.projects?.length ? `<div class="section"><div class="section-title">Projects</div>${data.projects.map(p => `<div class="entry"><div class="entry-title">${p.title}</div><div class="entry-sub">${p.tech}</div><div class="entry-desc">${p.description}</div></div>`).join('')}</div>` : ''}
${data.hobbies ? `<div class="section"><div class="section-title">Hobbies</div><p>${data.hobbies}</p></div>` : ''}
</body></html>`;

const generateCreativeHTML = (data, imgSrc) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Poppins', Arial, sans-serif; background: #fff; font-size: 12px; }
  .header { background: linear-gradient(135deg, #FF6B6B 0%, #F97316 50%, #FBBF24 100%); padding: 36px 32px; display: flex; align-items: center; gap: 24px; }
  .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,0.8); flex-shrink: 0; }
  .header-info { color: #fff; }
  .name { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
  .contact { font-size: 11px; opacity: 0.9; margin-top: 8px; line-height: 2; }
  .body { padding: 28px 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .col { }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: 700; color: #F97316; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .section-title::before { content: ""; display: inline-block; width: 3px; height: 14px; background: #F97316; border-radius: 2px; }
  .entry { margin-bottom: 10px; }
  .entry-title { font-weight: 600; font-size: 12px; color: #1a1a2e; }
  .entry-sub { color: #F97316; font-size: 11px; }
  .entry-desc { color: #666; font-size: 11px; margin-top: 2px; }
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 5px; }
  .skill-tag { background: linear-gradient(135deg, #FF6B6B, #F97316); color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  p { color: #555; font-size: 11px; line-height: 1.6; }
  .full-width { grid-column: 1 / -1; }
</style></head><body>
<div class="header">
  ${imgSrc ? `<img class="photo" src="${imgSrc}" />` : ''}
  <div class="header-info">
    <div class="name">${data.name || 'Your Name'}</div>
    <div class="contact">${[data.email, data.phone, data.address].filter(Boolean).join(' · ')}</div>
  </div>
</div>
<div class="body">
  ${data.objective ? `<div class="section full-width"><div class="section-title">About Me</div><p>${data.objective}</p></div>` : ''}
  ${data.education?.length ? `<div class="section col"><div class="section-title">Education</div>${data.education.map(e => `<div class="entry"><div class="entry-title">${e.degree}</div><div class="entry-sub">${e.institution}</div><div class="entry-desc">${[e.year, e.grade].filter(Boolean).join(' · ')}</div></div>`).join('')}</div>` : ''}
  ${data.skills?.length ? `<div class="section col"><div class="section-title">Skills</div><div class="skills-wrap">${data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}
  ${data.internship ? `<div class="section full-width"><div class="section-title">Internship</div><p>${data.internship}</p></div>` : ''}
  ${data.projects?.length ? `<div class="section full-width"><div class="section-title">Projects</div>${data.projects.map(p => `<div class="entry"><div class="entry-title">${p.title}</div><div class="entry-sub">${p.tech}</div><div class="entry-desc">${p.description}</div></div>`).join('')}</div>` : ''}
  ${data.hobbies ? `<div class="section full-width"><div class="section-title">Hobbies</div><p>${data.hobbies}</p></div>` : ''}
</div>
</body></html>`;

const HTML_GENERATORS = {
  simple: generateSimpleHTML,
  modern: generateModernHTML,
  dark: generateDarkHTML,
  creative: generateCreativeHTML,
};

// ─── SECTION COMPONENTS ────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, theme }) => {
  const T = THEMES[theme];
  return (
    <View style={[styles.sectionCard, { backgroundColor: T.card, borderColor: T.border, shadowColor: T.shadow }]}>
      <View style={styles.sectionCardHeader}>
        <Text style={styles.sectionCardIcon}>{icon}</Text>
        <Text style={[styles.sectionCardTitle, { color: T.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

const StyledInput = ({ theme, label, ...props }) => {
  const T = THEMES[theme];
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={[styles.inputLabel, { color: T.subtext }]}>{label}</Text> : null}
      <TextInput
        style={[styles.input, { backgroundColor: T.inputBg, borderColor: T.border, color: T.text }]}
        placeholderTextColor={T.subtext}
        {...props}
      />
    </View>
  );
};

const TagInput = ({ skills, onAdd, onRemove, theme }) => {
  const T = THEMES[theme];
  const [tagText, setTagText] = useState('');
  const handleAdd = () => {
    const trimmed = tagText.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onAdd(trimmed);
      setTagText('');
    }
  };
  return (
    <View>
      <View style={[styles.tagInputRow, { backgroundColor: T.inputBg, borderColor: T.border }]}>
        <TextInput
          style={[styles.tagInputField, { color: T.text }]}
          value={tagText}
          onChangeText={setTagText}
          placeholder="Add a skill..."
          placeholderTextColor={T.subtext}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={handleAdd} style={[styles.tagAddBtn, { backgroundColor: T.accent }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, lineHeight: 20 }}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagsWrap}>
        {skills.map((skill) => (
          <TouchableOpacity key={skill} onPress={() => onRemove(skill)} style={[styles.tag, { backgroundColor: T.tagBg }]}>
            <Text style={[styles.tagText, { color: T.tagText }]}>{skill}</Text>
            <Text style={[styles.tagRemove, { color: T.tagText }]}>×</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── SCREENS ───────────────────────────────────────────────────────────────────

// NAV BAR
const NavBar = ({ screen, setScreen, theme }) => {
  const T = THEMES[theme];
  const tabs = [
    { id: 'form', icon: '👤', label: 'Profile' },
    { id: 'sections', icon: '📚', label: 'Sections' },
    { id: 'template', icon: '🎨', label: 'Style' },
    { id: 'preview', icon: '📄', label: 'Preview' },
  ];
  return (
    <View style={[styles.navbar, { backgroundColor: T.navBar, borderTopColor: T.navBarBorder }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => setScreen(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, screen === tab.id && { transform: [{ scale: 1.2 }] }]}>{tab.icon}</Text>
          <Text style={[styles.navLabel, { color: screen === tab.id ? T.accent : T.subtext }]}>{tab.label}</Text>
          {screen === tab.id && <View style={[styles.navDot, { backgroundColor: T.accent }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// HEADER
const AppHeader = ({ theme, toggleTheme }) => {
  const T = THEMES[theme];
  return (
    <View style={[styles.appHeader, { backgroundColor: T.gradStart }]}>
      <StatusBar barStyle="light-content" backgroundColor={T.gradStart} />
      <Text style={styles.appHeaderTitle}>✦ Resume Builder</Text>
      <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleBtn}>
        <Text style={styles.themeToggleIcon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// FORM SCREEN
const FormScreen = ({ resume, setResume, theme }) => {
  const T = THEMES[theme];

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setResume(prev => ({
          ...prev,
          photo: manipulated.uri,
          photoBase64: `data:image/jpeg;base64,${manipulated.base64}`,
        }));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image: ' + e.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Photo */}
      <SectionCard title="Profile Photo" icon="📸" theme={theme}>
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={[styles.photoCircle, { borderColor: T.accent, backgroundColor: T.accentSoft }]}>
            {resume.photo ? (
              <Image source={{ uri: resume.photo }} style={styles.photoImage} />
            ) : (
              <Text style={styles.photoPlaceholder}>Tap to{'\n'}Add Photo</Text>
            )}
          </TouchableOpacity>
          {resume.photo && (
            <TouchableOpacity onPress={() => setResume(p => ({ ...p, photo: null, photoBase64: null }))} style={[styles.removePhotoBtn, { borderColor: T.danger }]}>
              <Text style={{ color: T.danger, fontSize: 12 }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </SectionCard>

      {/* Personal Info */}
      <SectionCard title="Personal Info" icon="👤" theme={theme}>
        <StyledInput theme={theme} label="Full Name" value={resume.name} onChangeText={v => setResume(p => ({ ...p, name: v }))} placeholder="e.g. Rahul Sharma" />
        <StyledInput theme={theme} label="Email" value={resume.email} onChangeText={v => setResume(p => ({ ...p, email: v }))} placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" />
        <StyledInput theme={theme} label="Phone" value={resume.phone} onChangeText={v => setResume(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" keyboardType="phone-pad" />
        <StyledInput theme={theme} label="Address" value={resume.address} onChangeText={v => setResume(p => ({ ...p, address: v }))} placeholder="City, State, Country" multiline />
        <StyledInput theme={theme} label="Career Objective" value={resume.objective} onChangeText={v => setResume(p => ({ ...p, objective: v }))} placeholder="Write a brief objective..." multiline numberOfLines={3} style={{ minHeight: 70 }} />
      </SectionCard>
    </ScrollView>
  );
};

// SECTIONS SCREEN
const SectionsScreen = ({ resume, setResume, theme }) => {
  const T = THEMES[theme];

  const addEducation = () => {
    setResume(p => ({
      ...p,
      education: [...p.education, { id: generateId(), degree: '', institution: '', year: '', grade: '' }]
    }));
  };

  const updateEdu = (id, field, value) => {
    setResume(p => ({ ...p, education: p.education.map(e => e.id === id ? { ...e, [field]: value } : e) }));
  };

  const removeEdu = (id) => {
    setResume(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));
  };

  const addProject = () => {
    setResume(p => ({
      ...p,
      projects: [...p.projects, { id: generateId(), title: '', description: '', tech: '' }]
    }));
  };

  const updateProject = (id, field, value) => {
    setResume(p => ({ ...p, projects: p.projects.map(proj => proj.id === id ? { ...proj, [field]: value } : proj) }));
  };

  const removeProject = (id) => {
    setResume(p => ({ ...p, projects: p.projects.filter(proj => proj.id !== id) }));
  };

  const addSkill = (skill) => {
    setResume(p => ({ ...p, skills: [...p.skills, skill] }));
  };

  const removeSkill = (skill) => {
    setResume(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

      {/* Education */}
      <SectionCard title="Education" icon="🎓" theme={theme}>
        {resume.education.map((edu, index) => (
          <View key={edu.id} style={[styles.entryBlock, { borderColor: T.border, backgroundColor: T.inputBg }]}>
            <View style={styles.entryBlockHeader}>
              <Text style={[styles.entryBlockNum, { color: T.accent }]}>#{index + 1}</Text>
              {resume.education.length > 1 && (
                <TouchableOpacity onPress={() => removeEdu(edu.id)}>
                  <Text style={{ color: T.danger, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <StyledInput theme={theme} label="Degree / Course" value={edu.degree} onChangeText={v => updateEdu(edu.id, 'degree', v)} placeholder="B.Tech Computer Science" />
            <StyledInput theme={theme} label="Institution" value={edu.institution} onChangeText={v => updateEdu(edu.id, 'institution', v)} placeholder="University / College Name" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <StyledInput theme={theme} label="Year" value={edu.year} onChangeText={v => updateEdu(edu.id, 'year', v)} placeholder="2020–2024" />
              </View>
              <View style={{ flex: 1 }}>
                <StyledInput theme={theme} label="Grade / CGPA" value={edu.grade} onChangeText={v => updateEdu(edu.id, 'grade', v)} placeholder="8.5 / 10" />
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity onPress={addEducation} style={[styles.addEntryBtn, { borderColor: T.accent, backgroundColor: T.accentSoft }]}>
          <Text style={[styles.addEntryBtnText, { color: T.accent }]}>+ Add Education</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Skills" icon="⚡" theme={theme}>
        <TagInput skills={resume.skills} onAdd={addSkill} onRemove={removeSkill} theme={theme} />
      </SectionCard>

      {/* Internship */}
      <SectionCard title="Internship" icon="💼" theme={theme}>
        <StyledInput
          theme={theme}
          label="Internship Details"
          value={resume.internship}
          onChangeText={v => setResume(p => ({ ...p, internship: v }))}
          placeholder="Company name, role, duration, responsibilities..."
          multiline
          numberOfLines={4}
          style={{ minHeight: 90 }}
        />
      </SectionCard>

      {/* Projects */}
      <SectionCard title="Projects" icon="🚀" theme={theme}>
        {resume.projects.map((proj, index) => (
          <View key={proj.id} style={[styles.entryBlock, { borderColor: T.border, backgroundColor: T.inputBg }]}>
            <View style={styles.entryBlockHeader}>
              <Text style={[styles.entryBlockNum, { color: T.accent }]}>Project #{index + 1}</Text>
              {resume.projects.length > 1 && (
                <TouchableOpacity onPress={() => removeProject(proj.id)}>
                  <Text style={{ color: T.danger, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <StyledInput theme={theme} label="Project Title" value={proj.title} onChangeText={v => updateProject(proj.id, 'title', v)} placeholder="e.g. E-Commerce App" />
            <StyledInput theme={theme} label="Technologies Used" value={proj.tech} onChangeText={v => updateProject(proj.id, 'tech', v)} placeholder="React Native, Node.js, MongoDB" />
            <StyledInput theme={theme} label="Description" value={proj.description} onChangeText={v => updateProject(proj.id, 'description', v)} placeholder="Brief description of the project..." multiline numberOfLines={3} style={{ minHeight: 65 }} />
          </View>
        ))}
        <TouchableOpacity onPress={addProject} style={[styles.addEntryBtn, { borderColor: T.accent, backgroundColor: T.accentSoft }]}>
          <Text style={[styles.addEntryBtnText, { color: T.accent }]}>+ Add Project</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* Hobbies */}
      <SectionCard title="Hobbies & Interests" icon="🎯" theme={theme}>
        <StyledInput
          theme={theme}
          label="Hobbies"
          value={resume.hobbies}
          onChangeText={v => setResume(p => ({ ...p, hobbies: v }))}
          placeholder="Reading, Photography, Coding, Hiking..."
          multiline
          numberOfLines={2}
        />
      </SectionCard>
    </ScrollView>
  );
};

// TEMPLATE SCREEN
const TemplateScreen = ({ resume, setResume, theme }) => {
  const T = THEMES[theme];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <Text style={[styles.templateScreenTitle, { color: T.text }]}>Choose Your Template</Text>
      <Text style={[styles.templateScreenSub, { color: T.subtext }]}>Select a resume style that suits you</Text>
      <View style={styles.templateGrid}>
        {TEMPLATES.map((tmpl) => {
          const isSelected = resume.selectedTemplate === tmpl.id;
          return (
            <TouchableOpacity
              key={tmpl.id}
              onPress={() => setResume(p => ({ ...p, selectedTemplate: tmpl.id }))}
              style={[
                styles.templateCard,
                { backgroundColor: T.card, borderColor: isSelected ? tmpl.color : T.border, shadowColor: isSelected ? tmpl.color : T.shadow }
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.templatePreviewBox, { backgroundColor: tmpl.color + '22' }]}>
                <Text style={{ fontSize: 36 }}>{tmpl.icon}</Text>
              </View>
              <Text style={[styles.templateCardLabel, { color: T.text }]}>{tmpl.label}</Text>
              {isSelected && (
                <View style={[styles.templateCheckBadge, { backgroundColor: tmpl.color }]}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.templateScreenTitle, { color: T.text, marginTop: 24 }]}>Tips</Text>
      <View style={[styles.tipsCard, { backgroundColor: T.accentSoft, borderColor: T.accent + '40' }]}>
        {[
          '📸 Add a professional profile photo',
          '📝 Write a clear career objective',
          '⚡ Add at least 5-8 relevant skills',
          '🚀 Showcase 2-3 strong projects',
          '🎓 Include your latest education',
        ].map((tip, i) => (
          <Text key={i} style={[styles.tipText, { color: T.text }]}>{tip}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

// PREVIEW SCREEN
  const PreviewScreen = ({ resume, theme }) => {
  const T = THEMES[theme];
  const [loading, setLoading] = useState(false);
  const isSharing = useRef(false);

  const validateResume = () => {
    if (!resume.name?.trim()) return 'Please enter your full name.';
    if (!resume.email?.trim()) return 'Please enter your email address.';
    return null;
  };

  // ✅ FIXED generateAndSharePDF
  const generateAndSharePDF = async () => {
  if (isSharing.current) return;

  const validationError = validateResume();
  if (validationError) {
    Alert.alert('Missing Info', validationError);
    return;
  }

  isSharing.current = true;
  setLoading(true);

  try {
    const imgSrc = resume.photoBase64 || null;
    const generator = HTML_GENERATORS[resume.selectedTemplate] || generateModernHTML;
    const html = generator(resume, imgSrc);

    // ✅ Generate PDF
    const { uri } = await Print.printToFileAsync({ html });

    if (!uri) throw new Error('PDF not created');

    // ✅ CHECK sharing available
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Error', 'Sharing not supported on this device');
      return;
    }

    // ✅ SHARE PDF (IMPORTANT 🔥)
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share your Resume',
      UTI: 'com.adobe.pdf',
    });

  } catch (e) {
    Alert.alert('Error', 'Failed: ' + e.message);
  } finally {
    setLoading(false);
    isSharing.current = false;
  }
};
  const PreviewSection = ({ title, children }) => (
    <View style={[styles.previewSection, { borderBottomColor: T.border }]}>
      <Text style={[styles.previewSectionTitle, { color: T.accent }]}>{title}</Text>
      {children}
    </View>
  );

  const tmpl = TEMPLATES.find(t => t.id === resume.selectedTemplate);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={[styles.previewHeader, { backgroundColor: tmpl?.color || T.accent }]}>
          {resume.photo ? (
            <Image source={{ uri: resume.photo }} style={styles.previewPhoto} />
          ) : (
            <View style={[styles.previewPhotoPlaceholder, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={{ fontSize: 36 }}>👤</Text>
            </View>
          )}
          <Text style={styles.previewName}>{resume.name || 'Your Name'}</Text>
          {resume.email ? <Text style={styles.previewContact}>{resume.email}</Text> : null}
          {resume.phone ? <Text style={styles.previewContact}>{resume.phone}</Text> : null}
          {resume.address ? <Text style={styles.previewContact}>{resume.address}</Text> : null}
          <View style={[styles.previewBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{tmpl?.label} Template</Text>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {resume.objective ? (
            <PreviewSection title="Objective">
              <Text style={[styles.previewText, { color: T.subtext }]}>{resume.objective}</Text>
            </PreviewSection>
          ) : null}

          {resume.education?.some(e => e.degree || e.institution) ? (
            <PreviewSection title="Education">
              {resume.education.filter(e => e.degree || e.institution).map(edu => (
                <View key={edu.id} style={styles.previewEntry}>
                  <Text style={[styles.previewEntryTitle, { color: T.text }]}>{edu.degree}</Text>
                  <Text style={[styles.previewEntryMeta, { color: T.accent }]}>{edu.institution}</Text>
                  {(edu.year || edu.grade) ? <Text style={[styles.previewEntryMeta, { color: T.subtext }]}>{[edu.year, edu.grade].filter(Boolean).join(' · ')}</Text> : null}
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {resume.skills?.length > 0 ? (
            <PreviewSection title="Skills">
              <View style={styles.tagsWrap}>
                {resume.skills.map(skill => (
                  <View key={skill} style={[styles.tag, { backgroundColor: T.tagBg }]}>
                    <Text style={[styles.tagText, { color: T.tagText }]}>{skill}</Text>
                  </View>
                ))}
              </View>
            </PreviewSection>
          ) : null}

          {resume.internship ? (
            <PreviewSection title="Internship">
              <Text style={[styles.previewText, { color: T.subtext }]}>{resume.internship}</Text>
            </PreviewSection>
          ) : null}

          {resume.projects?.some(p => p.title) ? (
            <PreviewSection title="Projects">
              {resume.projects.filter(p => p.title).map(proj => (
                <View key={proj.id} style={styles.previewEntry}>
                  <Text style={[styles.previewEntryTitle, { color: T.text }]}>{proj.title}</Text>
                  {proj.tech ? <Text style={[styles.previewEntryMeta, { color: T.accent }]}>{proj.tech}</Text> : null}
                  {proj.description ? <Text style={[styles.previewText, { color: T.subtext }]}>{proj.description}</Text> : null}
                </View>
              ))}
            </PreviewSection>
          ) : null}

          {resume.hobbies ? (
            <PreviewSection title="Hobbies & Interests">
              <Text style={[styles.previewText, { color: T.subtext }]}>{resume.hobbies}</Text>
            </PreviewSection>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.fabRow}>
        

        <TouchableOpacity
          style={[styles.fabBtn, styles.fabPrimary, { backgroundColor: T.accent }]}
          onPress={() => generateAndSharePDF()}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={{ fontSize: 18 }}>📤</Text>
              <Text style={[styles.fabLabel, { color: '#fff' }]}>Share PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState('light');
  const [screen, setScreen] = useState('form');
  const [resume, setResume] = useState(DEFAULT_RESUME);
  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setResume({ ...DEFAULT_RESUME, ...parsed });
        }
      } catch (e) {
        console.warn('Load error:', e.message);
      } finally {
        setAppReady(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    })();
  }, []);

  useEffect(() => {
    if (!appReady) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
      } catch (e) {
        console.warn('Save error:', e.message);
      }
    };
    const timer = setTimeout(save, 800);
    return () => clearTimeout(timer);
  }, [resume, appReady]);

  const T = THEMES[theme];

  if (!appReady) {
    return (
      <SafeAreaProvider>
        <View style={[styles.splash, { backgroundColor: T.bg }]}>
          <Text style={{ fontSize: 48 }}>✦</Text>
          <Text style={[styles.splashTitle, { color: T.accent }]}>Resume Builder</Text>
          <ActivityIndicator color={T.accent} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'form': return <FormScreen resume={resume} setResume={setResume} theme={theme} />;
      case 'sections': return <SectionsScreen resume={resume} setResume={setResume} theme={theme} />;
      case 'template': return <TemplateScreen resume={resume} setResume={setResume} theme={theme} />;
      case 'preview': return <PreviewScreen resume={resume} theme={theme} />;
      default: return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.root, { backgroundColor: T.bg }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
            <AppHeader theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
            <View style={{ flex: 1 }}>
              {renderScreen()}
            </View>
            <NavBar screen={screen} setScreen={setScreen} theme={theme} />
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 10, letterSpacing: 1 },

  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  appHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  themeToggleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  themeToggleIcon: { fontSize: 18 },

  navbar: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 12 : 4, paddingTop: 4 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },

  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionCardIcon: { fontSize: 20, marginRight: 8 },
  sectionCardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '400',
  },

  photoSection: { alignItems: 'center', paddingVertical: 8 },
  photoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%', borderRadius: 55 },
  photoPlaceholder: { fontSize: 12, textAlign: 'center', color: '#aaa', lineHeight: 18 },
  removePhotoBtn: { marginTop: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

  tagInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  tagInputField: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  tagAddBtn: { width: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '600' },
  tagRemove: { fontSize: 14, marginLeft: 5, lineHeight: 16 },

  entryBlock: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  entryBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  entryBlockNum: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  addEntryBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addEntryBtnText: { fontSize: 14, fontWeight: '700' },

  templateScreenTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  templateScreenSub: { fontSize: 13, marginBottom: 18 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  templateCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  templatePreviewBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  templateCardLabel: { fontSize: 14, fontWeight: '700' },
  templateCheckBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tipsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  tipText: { fontSize: 13, fontWeight: '500', lineHeight: 20 },

  previewHeader: { padding: 28, alignItems: 'center' },
  previewPhoto: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  previewPhotoPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  previewName: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  previewContact: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 2 },
  previewBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  previewSection: { borderBottomWidth: 1, paddingVertical: 14 },
  previewSectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  previewEntry: { marginBottom: 10 },
  previewEntryTitle: { fontSize: 14, fontWeight: '700' },
  previewEntryMeta: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  previewText: { fontSize: 13, lineHeight: 20, marginTop: 2 },

  fabRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  fabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPrimary: {},
  fabSecondary: { borderWidth: 1.5 },
  fabLabel: { fontSize: 14, fontWeight: '700' },
});
