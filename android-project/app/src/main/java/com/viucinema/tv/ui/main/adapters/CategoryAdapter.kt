package com.viucinema.tv.ui.main.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.viucinema.tv.R
import com.viucinema.tv.data.model.CategoryItem

class CategoryAdapter(
    private var categories: List<CategoryItem> = emptyList(),
    private val onCategorySelected: (CategoryItem?) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {

    private var selectedIndex = 0

    fun updateData(newCategories: List<CategoryItem>) {
        categories = newCategories
        selectedIndex = 0
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_category, parent, false)
        return CategoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        val category = if (position == 0) null else categories[position - 1]
        val isSelected = position == selectedIndex
        holder.bind(category, isSelected) {
            val oldIndex = selectedIndex
            selectedIndex = holder.adapterPosition
            notifyItemChanged(oldIndex)
            notifyItemChanged(selectedIndex)
            onCategorySelected(category)
        }
    }

    override fun getItemCount(): Int = categories.size + 1 // +1 for "All Categories"

    class CategoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvCategoryName: TextView = itemView.findViewById(R.id.tvCategoryName)

        fun bind(
            category: CategoryItem?,
            isSelected: Boolean,
            onClick: () -> Unit
        ) {
            tvCategoryName.text = category?.name ?: "Toutes les catégories"

            if (isSelected) {
                tvCategoryName.setBackgroundResource(R.color.red_primary)
                tvCategoryName.setTextColor(Color.WHITE)
            } else {
                tvCategoryName.setBackgroundResource(R.color.card_bg)
                tvCategoryName.setTextColor(Color.LTGRAY)
            }

            itemView.setOnClickListener { onClick() }

            // TV D-Pad Focus Visual Feedback
            itemView.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    itemView.animate().scaleX(1.05f).scaleY(1.05f).setDuration(100).start()
                } else {
                    itemView.animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start()
                }
            }
        }
    }
}
