# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.inkwell.vanderbot.data.api.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Room
-keep class * extends androidx.room.RoomDatabase
