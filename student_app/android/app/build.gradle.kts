plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties
import java.io.FileInputStream

// Load keystore properties if present (safe fallback to debug signing when absent)
val keystoreProps = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) load(FileInputStream(f))
}
val hasKeystore = keystoreProps.getProperty("storeFile") != null

android {
    namespace = "academy.schoolify.student"
    // Target the latest Android SDK for modern devices
    compileSdk = 35
    // Pin NDK to the version required by Android plugins to avoid mismatch
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "academy.schoolify.student"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        // Target the latest Android SDK
        targetSdk = 35
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (hasKeystore) {
                storeFile = file(keystoreProps["storeFile"] ?: "")
                storePassword = (keystoreProps["storePassword"] ?: "") as String
                keyAlias = (keystoreProps["keyAlias"] ?: "") as String
                keyPassword = (keystoreProps["keyPassword"] ?: "") as String
            }
        }
    }

    buildTypes {
        release {
            // Use real release signing when key.properties is present; otherwise fall back to debug
            signingConfig = if (hasKeystore) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

flutter {
    source = "../.."
}
