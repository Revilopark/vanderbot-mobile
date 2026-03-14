package com.inkwell.vanderbot.di

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.inkwell.vanderbot.data.db.VanderBotDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)    // Claude streaming can be slow
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    fun provideGson(): Gson = GsonBuilder().create()

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext ctx: Context): VanderBotDatabase =
        Room.databaseBuilder(ctx, VanderBotDatabase::class.java, "vanderbot.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides fun provideConversationDao(db: VanderBotDatabase) = db.conversationDao()
    @Provides fun provideMessageDao(db: VanderBotDatabase) = db.messageDao()
    @Provides fun provideDocumentDao(db: VanderBotDatabase) = db.documentDao()
}
