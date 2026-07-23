package com.viucinema.tv.ui.main.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.viucinema.tv.R
import com.viucinema.tv.data.model.MediaItem

class MediaAdapter(
    private var items: List<MediaItem> = emptyList(),
    private val onItemClick: (MediaItem) -> Unit,
    private val onItemLongClick: (MediaItem) -> Unit
) : RecyclerView.Adapter<MediaAdapter.MediaViewHolder>() {

    fun updateData(newItems: List<MediaItem>) {
        items = newItems
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MediaViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_media, parent, false)
        return MediaViewHolder(view)
    }

    override fun onBindViewHolder(holder: MediaViewHolder, position: Int) {
        val item = items[position]
        holder.bind(item, onItemClick, onItemLongClick)
    }

    override fun getItemCount(): Int = items.size

    class MediaViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivCover: ImageView = itemView.findViewById(R.id.ivCover)
        private val tvTitle: TextView = itemView.findViewById(R.id.tvTitle)

        fun bind(
            item: MediaItem,
            onItemClick: (MediaItem) -> Unit,
            onItemLongClick: (MediaItem) -> Unit
        ) {
            tvTitle.text = item.getDisplayName()

            Glide.with(itemView.context)
                .load(item.getImageUrl())
                .placeholder(android.R.color.darker_gray)
                .error(android.R.color.darker_gray)
                .into(ivCover)

            itemView.setOnClickListener { onItemClick(item) }
            itemView.setOnLongClickListener {
                onItemLongClick(item)
                true
            }

            // Android TV Focus Animation
            itemView.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    itemView.animate().scaleX(1.08f).scaleY(1.08f).setDuration(150).start()
                    itemView.setBackgroundResource(R.color.red_primary)
                } else {
                    itemView.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start()
                    itemView.setBackgroundResource(R.color.card_bg)
                }
            }
        }
    }
}
