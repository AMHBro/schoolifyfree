import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart';
import '../utils/web_open_stub.dart'
    if (dart.library.html) '../utils/web_open.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../models/teacher.dart';
import '../widgets/language_selection_dialog.dart';
import '../theme/design_system.dart';
import 'login_screen.dart';
import 'delete_account_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _formatBirthdate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    try {
      final dt = DateTime.tryParse(raw);
      if (dt == null) return raw;
      final d = dt.day.toString().padLeft(2, '0');
      final m = dt.month.toString().padLeft(2, '0');
      final y = dt.year.toString();
      return '$d/$m/$y';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      appBar: AppBar(
        title: Text(context.tr('settings.title')),
        automaticallyImplyLeading: true,
        elevation: 0,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final teacher = authProvider.teacher;

          if (teacher == null) {
            return _buildGuestProfile(context);
          }

          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(DSSpacing.containerPadding),
              child: Column(
                children: [
                  // Profile Header
                  _buildProfileHeader(teacher),

                  const SizedBox(height: DSSpacing.sectionSpacing),

                  // Settings Sections
                  _buildSettingsSection(
                    title: context.tr('settings.account'),
                    icon: Icons.person_outline,
                    children: [
                      _buildInfoTile(
                        context.tr('settings.profile_dialog.name'),
                        teacher.name,
                        Icons.badge,
                      ),
                      _buildInfoTile(
                        context.tr('settings.phone_number'),
                        teacher.phoneNumber,
                        Icons.phone,
                      ),
                      if (teacher.age != null)
                        _buildInfoTile(
                          context.tr('settings.profile_dialog.age'),
                          teacher.age.toString(),
                          Icons.cake,
                        ),
                      if (teacher.gender != null)
                        _buildInfoTile(
                          context.tr('settings.profile_dialog.gender'),
                          _localizedGender(teacher.gender),
                          Icons.wc,
                        ),
                      if (teacher.birthdate != null)
                        _buildInfoTile(
                          context.tr('settings.profile_dialog.birthdate'),
                          _formatBirthdate(teacher.birthdate),
                          Icons.calendar_today,
                        ),
                      _buildInfoTile(
                        context.tr('settings.profile_dialog.subjects'),
                        teacher.subjects.map((s) => s.name).join(', '),
                        Icons.menu_book_outlined,
                      ),
                      _buildInfoTile(
                        context.tr('settings.profile_dialog.stages'),
                        teacher.stages.map((s) => s.name).join(', '),
                        Icons.school_outlined,
                      ),
                    ],
                  ),

                  const SizedBox(height: DSSpacing.sectionSpacing),

                  _buildSettingsSection(
                    title: context.tr('settings.title'),
                    icon: Icons.settings_outlined,
                    children: [
                      _buildSettingsItem(
                        icon: Icons.notifications_outlined,
                        title: context.tr('settings.notifications'),
                        subtitle: context.tr('settings.notifications_subtitle'),
                        onTap: () => _showNotificationSettings(),
                      ),
                      _buildSettingsItem(
                        icon: Icons.privacy_tip_outlined,
                        title: context.tr('settings.privacy'),
                        subtitle: context.tr('settings.privacy_desc'),
                        onTap: () => _showPrivacyPolicy(),
                      ),
                      Consumer<LocalizationProvider>(
                        builder: (context, localizationProvider, child) {
                          return _buildSettingsItem(
                            icon: Icons.language,
                            title: context.tr('settings.language'),
                            subtitle: localizationProvider.currentLanguageName,
                            onTap: () => _showLanguageSettings(),
                          );
                        },
                      ),
                      _buildSettingsItem(
                        icon: Icons.help_outline,
                        title: context.tr('settings.help_support'),
                        subtitle: context.tr('settings.help_support_subtitle'),
                        onTap: () => _showHelpBottomSheet(),
                      ),
                    ],
                  ),

                  // Support items moved above into Settings section per design
                  const SizedBox(height: DSSpacing.sectionSpacing),

                  // Logout Button
                  _buildLogoutButton(),

                  const SizedBox(height: 12),

                  // Delete Account Button
                  _buildDeleteAccountButton(),

                  const SizedBox(height: DSSpacing.sectionSpacing),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGuestProfile(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_outline, size: 80, color: DSColors.primary),
            const SizedBox(height: 12),
            Text(
              context.tr('guest.profile_title', fallback: 'Guest Profile'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(
                'guest.profile_message',
                fallback: 'Login to view your profile and settings.',
              ),
              textAlign: TextAlign.center,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(context.tr('common.login', fallback: 'Login')),
            ),
          ],
        ),
      ),
    );
  }

  void _showPrivacyPolicy() {
    _openExternalUrl(Uri.parse('https://www.schoolify.academy/privacy-policy'));
  }

  Future<void> _openExternalUrl(Uri uri) async {
    try {
      // Handle web separately to avoid popup blockers and choose target
      if (kIsWeb) {
        // Try JS window.open first (same-tick), fallback to url_launcher
        bool ok = await webOpenUrl(uri);
        if (!ok) {
          final isHttp = uri.scheme == 'http' || uri.scheme == 'https';
          ok = await launchUrl(
            uri,
            webOnlyWindowName: isHttp ? '_blank' : '_self',
          );
        }
        if (!ok && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.tr('common.could_not_open_link'))),
          );
        }
        return;
      }

      // On mobile/desktop, launch externally without pre-check to avoid false negatives
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('common.could_not_open_link'))),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('common.could_not_open_link'))),
        );
      }
    }
  }

  String _localizedGender(String? raw) {
    final value = (raw ?? '').toLowerCase().trim();
    if (value == 'male' || value == 'm' || value == 'ذكر') {
      return Directionality.of(context) == TextDirection.rtl ? 'ذكر' : 'Male';
    }
    if (value == 'female' || value == 'f' || value == 'أنثى') {
      return Directionality.of(context) == TextDirection.rtl
          ? 'أنثى'
          : 'Female';
    }
    return Directionality.of(context) == TextDirection.rtl ? 'غير محدد' : 'N/A';
  }

  Widget _buildProfileHeader(Teacher teacher) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.medium),
        boxShadow: const [DSShadows.card],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: DSColors.white,
            child: CircleAvatar(
              radius: 37,
              backgroundColor: DSColors.primary.withOpacity(0.12),
              child: const Icon(
                Icons.person,
                size: 40,
                color: DSColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  teacher.name,
                  style: DSTypography.h2.copyWith(color: DSColors.charcoal),
                ),
                const SizedBox(height: 4),
                Text(
                  teacher.phoneNumber,
                  style: DSTypography.body.copyWith(color: DSColors.darkGray),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: DSColors.primary.withOpacity(0.10),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    context.tr('settings.profile_header.teacher_role'),
                    style: DSTypography.caption.copyWith(
                      color: DSColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(icon, color: DSColors.darkGray, size: 24),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                ),
              ],
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isLast = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(DSRadii.large),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(color: DSColors.mediumGray, width: 0.5),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: DSColors.white,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: DSColors.darkGray, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: DSTypography.body.copyWith(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: DSColors.charcoal,
                      ),
                    ),
                    Text(subtitle, style: DSTypography.caption),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: DSColors.mediumGray,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: DSColors.mediumGray, width: 0.5)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: DSColors.darkGray),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: DSTypography.caption),
                const SizedBox(height: 2),
                Text(
                  value.isNotEmpty ? value : context.tr('common.n_a'),
                  style: DSTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showProfileDialog(Teacher teacher) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('settings.profile_dialog.title')),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildProfileRow(
                context.tr('settings.profile_dialog.name'),
                teacher.name,
              ),
              _buildProfileRow(
                context.tr('settings.profile_dialog.phone'),
                teacher.phoneNumber,
              ),
              if (teacher.age != null)
                _buildProfileRow(
                  context.tr('settings.profile_dialog.age'),
                  teacher.age.toString(),
                ),
              if (teacher.gender != null)
                _buildProfileRow(
                  context.tr('settings.profile_dialog.gender'),
                  teacher.gender!,
                ),
              if (teacher.birthdate != null)
                _buildProfileRow(
                  context.tr('settings.profile_dialog.birthdate'),
                  teacher.birthdate.toString().split(' ')[0],
                ),
              _buildProfileRow(
                context.tr('settings.profile_dialog.subjects'),
                teacher.subjects.map((s) => s.name).join(', '),
              ),
              _buildProfileRow(
                context.tr('settings.profile_dialog.stages'),
                teacher.stages.map((s) => s.name).join(', '),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('common.close')),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    context.tr(
                      'settings.profile_dialog.edit_profile_coming_soon',
                    ),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: DSColors.primary,
              foregroundColor: DSColors.white,
            ),
            child: Text(context.tr('common.edit')),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 80, child: Text('$label:', style: DSTypography.h3)),
          Expanded(
            child: Text(
              value.isNotEmpty
                  ? value
                  : context.tr('settings.profile_dialog.not_specified'),
              style: DSTypography.body.copyWith(
                color: value.isNotEmpty ? DSColors.charcoal : DSColors.darkGray,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('settings.logout_dialog.title')),
        content: Text(context.tr('settings.logout_dialog.message')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('common.cancel')),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await Provider.of<AuthProvider>(context, listen: false).logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: DSColors.error,
              foregroundColor: DSColors.white,
            ),
            child: Text(context.tr('settings.logout')),
          ),
        ],
      ),
    );
  }

  void _showChangePasswordDialog() {
    // Disabled per request: change password is not available in teacher app.
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.tr('common.not_available'))));
  }

  void _showPhoneUpdateDialog(Teacher teacher) {
    // Disabled per request: phone update is not available in teacher app.
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.tr('common.not_available'))));
  }

  void _showNotificationSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.tr('settings.coming_soon.notifications'))),
    );
  }

  void _showLanguageSettings() {
    showLanguageSelectionDialog(context);
  }

  void _showThemeSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(context.tr('settings.coming_soon.theme'))),
    );
  }

  // Replaced with bottom sheet version to match student app
  void _showHelpBottomSheet() {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      backgroundColor: DSColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.support_agent, color: DSColors.primary),
                const SizedBox(width: 8),
                Text(
                  context.tr('settings.help_support'),
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: DSColors.mediumGray.withOpacity(0.6)),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.network(
                  'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                  width: 24,
                  height: 24,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(Icons.chat, color: DSColors.success),
                ),
              ),
              title: Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  '+964 776 0612 021',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              onTap: () async {
                await _openExternalUrl(
                  Uri.parse(
                    'https://wa.me/9647760612021?text=${Uri.encodeComponent(context.tr('settings.whatsapp_greeting'))}',
                  ),
                );
                if (ctx.mounted) Navigator.of(ctx).pop();
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.phone, color: DSColors.charcoal),
              title: Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  '+964 776 0612 021',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              onTap: () async {
                await _openExternalUrl(
                  Uri(scheme: 'tel', path: '+9647760612021'),
                );
                if (ctx.mounted) Navigator.of(ctx).pop();
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.email, color: DSColors.primary),
              title: Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  'support@schoolify.academy',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              onTap: () async {
                await _openExternalUrl(
                  Uri.parse('mailto:support@schoolify.academy'),
                );
                if (ctx.mounted) Navigator.of(ctx).pop();
              },
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: Text(
                  context.tr('common.cancel'),
                  style: const TextStyle(color: DSColors.darkGray),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Logout button matching student profile style
  Widget _buildLogoutButton() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ElevatedButton(
        onPressed: _showLogoutDialog,
        style: ElevatedButton.styleFrom(
          backgroundColor: DSColors.error,
          foregroundColor: DSColors.white,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DSRadii.medium),
          ),
          elevation: 2,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.logout, size: 20),
            const SizedBox(width: 8),
            Text(
              context.tr('settings.logout'),
              style: DSTypography.body.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: DSColors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Delete account destructive action
  Widget _buildDeleteAccountButton() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: OutlinedButton(
        onPressed: _handleDeleteAccount,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: DSColors.error, width: 1.2),
          foregroundColor: DSColors.error,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DSRadii.medium),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.delete_forever, size: 20),
            const SizedBox(width: 8),
            Text(
              context.tr('settings.delete_account'),
              style: DSTypography.body.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: DSColors.error,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleDeleteAccount() async {
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const DeleteAccountScreen()));
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final teacher = auth.teacher;
    final phone = Uri.encodeComponent(teacher?.phoneNumber ?? "");
    final uri = Uri.parse(
      'https://www.schoolify.academy/delete-account?type=teacher&phone=$phone',
    );
    await _openExternalUrl(uri);
  }

  void _showFeedbackDialog() {
    final feedbackController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('settings.feedback_dialog.title')),
        content: SizedBox(
          width: double.maxFinite,
          child: TextField(
            controller: feedbackController,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: context.tr('settings.feedback_dialog.label'),
              border: const OutlineInputBorder(),
              alignLabelWithHint: true,
              hintText: context.tr('settings.feedback_dialog.placeholder'),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('common.cancel')),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    context.tr('settings.feedback_dialog.thank_you'),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: DSColors.primary,
              foregroundColor: DSColors.white,
            ),
            child: Text(context.tr('common.send')),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('settings.about_dialog.title')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.tr('settings.about_dialog.app_name')),
            const SizedBox(height: 8),
            Text(context.tr('settings.about_dialog.version')),
            const SizedBox(height: 8),
            Text(context.tr('settings.about_dialog.build')),
            const SizedBox(height: 16),
            Text(
              context.tr('settings.about_dialog.description'),
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('common.close')),
          ),
        ],
      ),
    );
  }
}
