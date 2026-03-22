import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class DeveloperSettings extends StatefulWidget {
  const DeveloperSettings({super.key});

  @override
  State<DeveloperSettings> createState() => _DeveloperSettingsState();
}

class _DeveloperSettingsState extends State<DeveloperSettings> {
  String? _customUrl;
  bool _useCustomUrl = false;
  final _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _customUrl = prefs.getString('custom_api_url');
      _useCustomUrl = prefs.getBool('use_custom_url') ?? false;
      _urlController.text = _customUrl ?? '';
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('custom_api_url', _urlController.text);
    await prefs.setBool('use_custom_url', _useCustomUrl);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Settings saved! Restart app to apply changes.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Widget _buildUrlOption(String title, String url, {bool isCustom = false}) {
    final isSelected = isCustom ? _useCustomUrl : (!_useCustomUrl && AppConfig.baseUrl == url);
    
    return Card(
      color: isSelected ? Colors.blue.shade50 : null,
      child: ListTile(
        title: Text(title),
        subtitle: Text(url),
        leading: Icon(
          isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
          color: isSelected ? Colors.blue : null,
        ),
        onTap: () {
          setState(() {
            if (isCustom) {
              _useCustomUrl = true;
            } else {
              _useCustomUrl = false;
              _urlController.text = url;
            }
          });
          _saveSettings();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Only show in debug mode
    if (!kDebugMode) {
      return const SizedBox.shrink();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Developer Settings'),
        backgroundColor: Colors.orange,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'API Configuration',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Current: ${AppConfig.baseUrl}',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            
            _buildUrlOption(
              'Production',
              'https://sms-backend-production-eedb.up.railway.app',
            ),
            
            _buildUrlOption(
              'Local Development',
              'http://localhost:3000',
            ),
            
            _buildUrlOption(
              'Android Emulator',
              'http://10.0.2.2:3000',
            ),
            
            const SizedBox(height: 16),
            
            // Custom URL section
            Card(
              color: _useCustomUrl ? Colors.blue.shade50 : null,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _useCustomUrl ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: _useCustomUrl ? Colors.blue : null,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Custom URL',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _urlController,
                      decoration: const InputDecoration(
                        hintText: 'Enter custom API URL',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _useCustomUrl = value.isNotEmpty;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saveSettings,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Save Settings'),
              ),
            ),
            
            const SizedBox(height: 16),
            
            const Card(
              color: Colors.amber,
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Note: Restart the app after changing settings for changes to take effect.',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }
} 