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
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _schoolCodeController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _schoolCodeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    try {
      final res = await ApiService.sendDeleteAccountRequest(
        phoneNumber: _phoneController.text.trim(),
        schoolCode: _schoolCodeController.text.trim().toUpperCase(),
      );
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.tr('settings.delete_account_request_sent', fallback: 'Request submitted.'),
            ),
          ),
        );
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              (res['message'] ?? context.tr('common.something_went_wrong', fallback: 'Something went wrong')).toString(),
            ),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('common.something_went_wrong', fallback: 'Something went wrong'))),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('settings.delete_account', fallback: 'Delete Account')),
      ),
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
                    context.tr('settings.delete_account_description', fallback: 'Confirm your phone and school code to send a deletion request.'),
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: context.tr('settings.phone_number', fallback: 'Phone number'),
                      border: const OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('validation.required', fallback: 'Required');
                      }
                      if (value.replaceAll(RegExp(r'\D'), '').length < 8) {
                        return context.tr('validation.phone_invalid', fallback: 'Enter a valid phone number');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _schoolCodeController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: context.tr('settings.school_code', fallback: 'School code'),
                      border: const OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('validation.required', fallback: 'Required');
                      }
                      if (value.trim().length < 3) {
                        return context.tr('validation.school_code_invalid', fallback: 'Enter a valid school code');
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
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.delete_forever),
                    label: Text(context.tr('settings.delete_account_confirm', fallback: 'Delete my account')),
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
