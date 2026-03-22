import 'package:flutter/material.dart';
import '../theme/design_system.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentCodeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _studentCodeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    try {
      final response = await ApiService.sendStudentDeleteRequest(
        studentCode: _studentCodeController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('profile.delete_request_sent'))),
        );
        Navigator.of(context).pop();
      } else {
        final msg =
            (response['message'] ?? context.tr('common.something_went_wrong'))
                .toString();
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('common.something_went_wrong'))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.tr('profile_delete.title'))),
      backgroundColor: DSColors.lightGray,
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(DSSpacing.containerPadding),
          child: Container(
            decoration: BoxDecoration(
              color: DSColors.white,
              borderRadius: BorderRadius.circular(DSRadii.large),
              boxShadow: const [DSShadows.card],
            ),
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    context.tr('profile_delete.description_student'),
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _studentCodeController,
                    decoration: InputDecoration(
                      labelText: context.tr('profile.student_code'),
                      border: const OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if ((v ?? '').trim().isEmpty) {
                        return context.tr('validation.required');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: context.tr('auth.password'),
                      border: const OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if ((v ?? '').isEmpty) {
                        return context.tr('validation.required');
                      }
                      if ((v ?? '').length < 6) {
                        return context.tr('validation.password_short');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _submitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: DSColors.error,
                      foregroundColor: DSColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(DSRadii.medium),
                      ),
                    ),
                    icon: _submitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.delete_forever),
                    label: Text(context.tr('profile_delete.confirm')),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
