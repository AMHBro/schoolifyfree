import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../widgets/language_selection_dialog.dart';
import 'login_screen.dart';
// import kept intentionally removed after flow changed to ForgotPasswordScreen
import '../theme/design_system.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';
import 'package:flutter/foundation.dart';
import '../utils/web_open_stub.dart'
    if (dart.library.html) '../utils/web_open.dart';
import 'delete_account_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _currentAcademicYear() {
    final now = DateTime.now();
    final int startYear = now.month >= 7 ? now.year : now.year - 1;
    final int endYear = startYear + 1;
    return '$startYear-$endYear';
  }

  String _localizedGender(dynamic rawGender) {
    final value = (rawGender ?? '').toString().toLowerCase().trim();
    if (value == 'male' || value == 'm' || value == 'ذكر') {
      return context.tr('home.gender_male');
    }
    if (value == 'female' || value == 'f' || value == 'أنثى') {
      return context.tr('home.gender_female');
    }
    return context.tr('common.n_a');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, LocalizationProvider>(
      builder: (context, authProvider, localizationProvider, child) {
        final studentData = authProvider.studentData;

        final isGuest = authProvider.token == null;
        return Scaffold(
          appBar: AppBar(title: Text(context.tr('profile.title'))),
          body: isGuest
              ? _guestBody(context)
              : RefreshIndicator(
                  color: DSColors.primary,
                  backgroundColor: DSColors.white,
                  onRefresh: () async {
                    await authProvider.refreshProfile();
                  },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Padding(
                      padding: const EdgeInsets.all(DSSpacing.containerPadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Profile Header
                          _buildProfileHeader(studentData),
                          const SizedBox(height: DSSpacing.sectionSpacing),

                          // Personal Information
                          _buildPersonalInfo(studentData),
                          const SizedBox(height: DSSpacing.sectionSpacing),

                          // Academic Information
                          _buildAcademicInfo(studentData),
                          const SizedBox(height: DSSpacing.sectionSpacing),

                          // Settings
                          _buildSettings(),
                          const SizedBox(height: DSSpacing.sectionSpacing),

                          // Delete Account (platform specific)
                          _buildDeleteAccountButton(),
                          const SizedBox(height: 12),

                          // Logout Button
                          _buildLogoutButton(authProvider),
                        ],
                      ),
                    ),
                  ),
                ),
        );
      },
    );
  }

  Widget _guestBody(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_outline, size: 80, color: DSColors.primary),
            const SizedBox(height: 12),
            Text(
              context.tr('guest.profile_title'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('guest.profile_message'),
              textAlign: TextAlign.center,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pushNamed('/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(context.tr('common.login')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(Map<String, dynamic>? studentData) {
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
          Stack(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: DSColors.white,
                child: CircleAvatar(
                  radius: 37,
                  backgroundColor: DSColors.primary.withOpacity(0.12),
                  child: Icon(Icons.person, size: 40, color: DSColors.primary),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: DSColors.success,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 14,
                    color: DSColors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentData?['name'] ??
                      context.tr('profile.student_name_placeholder'),
                  style: DSTypography.h2.copyWith(color: DSColors.charcoal),
                ),
                const SizedBox(height: 4),
                Text(
                  studentData?['studentCode'] ??
                      context.tr('profile.student_code_placeholder'),
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
                    studentData?['class'] ??
                        context.tr('profile.class_placeholder'),
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

  Widget _buildPersonalInfo(Map<String, dynamic>? studentData) {
    return _buildSection(
      context.tr('profile.personal_info'),
      Icons.person_outline,
      [
        _buildInfoTile(
          context.tr('profile.full_name'),
          studentData?['name'] ?? context.tr('common.n_a'),
          Icons.badge,
        ),
        _buildInfoTile(
          context.tr('profile.student_code'),
          studentData?['studentCode'] ?? context.tr('common.n_a'),
          Icons.qr_code,
        ),
        _buildInfoTile(
          context.tr('profile.phone_number'),
          studentData?['phoneNumber'] ?? context.tr('common.n_a'),
          Icons.phone,
        ),
        _buildInfoTile(
          context.tr('profile.age'),
          studentData?['age']?.toString() ?? context.tr('common.n_a'),
          Icons.cake,
        ),
        _buildInfoTile(
          context.tr('profile.gender'),
          _localizedGender(studentData?['gender']),
          Icons.wc,
        ),
      ],
    );
  }

  Widget _buildAcademicInfo(Map<String, dynamic>? studentData) {
    return _buildSection(
      context.tr('profile.academic_info'),
      Icons.school_outlined,
      [
        _buildInfoTile(
          context.tr('profile.school'),
          studentData?['school']?['name'] ?? context.tr('common.n_a'),
          Icons.business,
        ),
        _buildInfoTile(
          context.tr('profile.school_code'),
          studentData?['schoolCode'] ?? context.tr('common.n_a'),
          Icons.numbers,
        ),
        _buildInfoTile(
          context.tr('profile.class_grade'),
          studentData?['class'] ?? context.tr('common.n_a'),
          Icons.class_,
        ),
        _buildInfoTile(
          context.tr('profile.academic_year'),
          _currentAcademicYear(),
          Icons.calendar_today,
        ),
      ],
    );
  }

  Widget _buildSettings() {
    return _buildSection(
      context.tr('profile.settings'),
      Icons.settings_outlined,
      [
        _buildSettingsTile(
          context.tr('profile.notifications'),
          context.tr('profile.notifications_desc'),
          Icons.notifications_outlined,
          () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(context.tr('profile.notifications_coming_soon')),
              ),
            );
          },
        ),
        _buildSettingsTile(
          context.tr('profile.privacy'),
          context.tr('profile.privacy_desc'),
          Icons.privacy_tip_outlined,
          () async {
            final uri = Uri.parse(
              'https://www.schoolify.academy/privacy-policy',
            );
            await _openExternalUrl(uri);
          },
        ),
        _buildSettingsTile(
          context.tr('profile.language'),
          context.tr('profile.language_desc'),
          Icons.language_outlined,
          () {
            showLanguageSelectionDialog(context);
          },
        ),
        _buildSettingsTile(
          context.tr('profile.help_support'),
          context.tr('profile.help_support_desc'),
          Icons.help_outline,
          () {
            _showSupportBottomSheet();
          },
        ),
      ],
    );
  }

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
              context.tr('profile_delete.title'),
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
    final studentCode = Uri.encodeComponent(
      auth.studentData?['studentCode'] ?? '',
    );
    final uri = Uri.parse(
      'https://www.schoolify.academy/delete-account?type=student&studentCode=$studentCode',
    );
    await _openExternalUrl(uri);
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
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

  Widget _buildInfoTile(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: const BorderSide(color: DSColors.mediumGray, width: 0.5),
        ),
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
                  value,
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

  Widget _buildSettingsTile(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          border: Border(
            top: const BorderSide(color: DSColors.mediumGray, width: 0.5),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 24, color: DSColors.darkGray),
            const SizedBox(width: 12),
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
                  const SizedBox(height: 2),
                  Text(subtitle, style: DSTypography.caption),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 16, color: DSColors.mediumGray),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton(AuthProvider authProvider) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ElevatedButton(
        onPressed: () => _showLogoutDialog(authProvider),
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
              context.tr('home.logout'),
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

  // Language selection handled via bottom sheet in widgets/language_selection_dialog.dart

  void _showLogoutDialog(AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DSRadii.large),
          ),
          title: Row(
            children: [
              const Icon(Icons.logout, color: DSColors.error),
              const SizedBox(width: 8),
              Text(context.tr('home.logout')),
            ],
          ),
          content: Text(context.tr('home.logout_confirm')),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(
                context.tr('common.cancel'),
                style: const TextStyle(color: DSColors.darkGray),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await authProvider.logout();
                if (mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                      builder: (context) => const LoginScreen(),
                    ),
                    (route) => false,
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.error,
                foregroundColor: DSColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(DSRadii.small),
                ),
              ),
              child: Text(context.tr('home.logout')),
            ),
          ],
        );
      },
    );
  }

  // Deprecated dialog version removed in favor of a bottom sheet

  Future<void> _showSupportBottomSheet() async {
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );
    await showModalBottomSheet(
      context: context,
      useSafeArea: true,
      backgroundColor: DSColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Directionality(
        textDirection: localizationProvider.textDirection,
        child: Padding(
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
                    context.tr('profile.help_support'),
                    style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Divider(color: DSColors.mediumGray.withOpacity(0.6)),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(MdiIcons.whatsapp, color: DSColors.success),
                title: const Directionality(
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
                      'https://wa.me/9647760612021?text=${Uri.encodeComponent('Hello, I need support.')}',
                    ),
                  );
                  if (ctx.mounted) Navigator.of(ctx).pop();
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.phone, color: DSColors.charcoal),
                title: const Directionality(
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
                leading: const Icon(Icons.email, color: DSColors.primary),
                title: const Directionality(
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
      ),
    );
  }

  Future<void> _openExternalUrl(Uri uri) async {
    try {
      if (kIsWeb) {
        // Try JS window.open synchronously; fallback to url_launcher.
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

  // Change Password flow removed per request
}
