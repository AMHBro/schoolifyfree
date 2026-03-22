import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:intl/intl.dart' as intl;
import '../theme/design_system.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import '../widgets/linkified_text.dart';

class ExamDetailsScreen extends StatefulWidget {
  final String examId;
  final String name;

  const ExamDetailsScreen({
    super.key,
    required this.examId,
    required this.name,
  });

  @override
  State<ExamDetailsScreen> createState() => _ExamDetailsScreenState();
}

class _ExamDetailsScreenState extends State<ExamDetailsScreen> {
  bool _isLoading = true;
  String? _error;
  Exam? _exam;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final token = auth.token;
    if (token == null) {
      setState(() {
        _error = context.tr('chats.authentication_required');
        _isLoading = false;
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
      _exam = null;
    });
    try {
      // Reuse list endpoint like ExamsScreen and find the one with matching ID
      final listResp = await ApiService.getExams(
        token,
        page: 1,
        limit: 200,
        upcomingOnly: false,
      );
      if (listResp['success'] == true) {
        final all = ExamResponse.fromJson(listResp['data']).exams;
        Exam? found;
        for (final e in all) {
          if (e.id == widget.examId) {
            found = e;
            break;
          }
        }
        setState(() {
          _exam = found;
          if (_exam == null) {
            _error = context.tr('exams.failed_to_load');
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          final msg = (listResp['message'] ?? '').toString();
          final isOffline =
              listResp['code'] == 'NETWORK_OFFLINE' ||
              msg.toUpperCase().contains('NETWORK_OFFLINE');
          _error = isOffline
              ? context.tr('common.offline_message')
              : (msg.isNotEmpty ? msg : context.tr('exams.failed_to_load'));
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = context.tr('common.offline_message');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dfDate = intl.DateFormat('dd MMM yyyy');
    final dfTime = intl.DateFormat('hh:mm a');
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.name),
        actions: const [
          Padding(
            padding: EdgeInsetsDirectional.only(end: 8),
            child: Icon(LineAwesomeIcons.calendar_solid),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _buildError(_error!)
            : _exam == null
            ? _buildError(context.tr('common.n_a'))
            : SingleChildScrollView(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [DSShadows.card],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _exam!.title,
                        style: DSTypography.h2.copyWith(
                          color: DSColors.charcoal,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: DSColors.darkGray,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            dfDate.format(_exam!.examDate),
                            style: DSTypography.caption,
                          ),
                          const SizedBox(width: 12),
                          const Icon(
                            Icons.access_time,
                            size: 14,
                            color: DSColors.darkGray,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            dfTime.format(_exam!.examDate),
                            style: DSTypography.caption,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          const Icon(
                            Icons.book_outlined,
                            size: 16,
                            color: DSColors.darkGray,
                          ),
                          const SizedBox(width: 6),
                          Text(_exam!.subject.name, style: DSTypography.body),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 16,
                            color: DSColors.darkGray,
                          ),
                          const SizedBox(width: 6),
                          Text(_exam!.classNumber, style: DSTypography.body),
                        ],
                      ),
                      if (_exam!.description != null &&
                          _exam!.description!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        LinkifiedText(
                          text: _exam!.description!,
                          style: DSTypography.body.copyWith(
                            color: DSColors.charcoal,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildError(String msg) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [DSShadows.card],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: DSColors.error),
          const SizedBox(height: 8),
          Text(msg, style: DSTypography.body.copyWith(color: DSColors.error)),
        ],
      ),
    );
  }
}
